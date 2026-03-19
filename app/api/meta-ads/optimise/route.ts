import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getCampaigns,
  getAdSets,
  getAds,
  getAdInsights,
  scoreAd,
  updateAdStatus,
  updateAdSetBudget,
} from '@/app/lib/ads/meta';
import type { OptimisationAction } from '@/app/lib/ads/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// POST /api/meta-ads/optimise
// Fetches all ad performance, sends to Claude, executes safe actions, surfaces copy rewrites for approval
export async function POST() {
  try {
    // 1. Gather all ads with 7-day insights
    const campaigns = await getCampaigns();
    const adsWithData: {
      campaignId: string;
      campaignName: string;
      adsetId: string;
      adId: string;
      adName: string;
      status: string;
      dailyBudgetPence: number;
      spend: number;
      ctr: number;
      cpc: number;
      cpl: number;
      leads: number;
      impressions: number;
      score: string;
      scoreReason: string;
    }[] = [];

    for (const campaign of campaigns) {
      const adsets = await getAdSets(campaign.id);
      for (const adset of adsets) {
        const ads = await getAds(adset.id);
        for (const ad of ads) {
          const insights = await getAdInsights(ad.id, 'last_7d');
          const score = insights
            ? scoreAd(insights)
            : { score: null, label: 'insufficient' as const, reason: 'No data' };

          adsWithData.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            adsetId: adset.id,
            adId: ad.id,
            adName: ad.name,
            status: ad.status,
            dailyBudgetPence: parseInt(adset.daily_budget ?? '0', 10),
            spend: insights?.spend ?? 0,
            ctr: insights?.ctr ?? 0,
            cpc: insights?.cpc ?? 0,
            cpl: insights?.cpl ?? 0,
            leads: insights?.leads ?? 0,
            impressions: insights?.impressions ?? 0,
            score: score.label,
            scoreReason: score.reason,
          });
        }
      }
    }

    if (!adsWithData.length) {
      return NextResponse.json({ message: 'No ads found to optimise', actions: [] });
    }

    // 2. Ask Claude
    const prompt = `You are a Meta Ads optimisation specialist for PT Launch Lab, a UK personal trainer education company.

BUSINESS CONTEXT:
- Product: NCFE Level 3 PT qualification with business mentorship — £1,399 full or payment plan
- Target: UK adults 18-45 wanting to become personal trainers
- Funnel: Ad → Quiz or Funnel page → Book call → Enrol
- Acceptable CPL target: under £12
- Acceptable CPC target: under £1.80
- Minimum CTR to remain active: 0.8%

AD PERFORMANCE DATA (last 7 days):
${JSON.stringify(adsWithData, null, 2)}

AVAILABLE ACTIONS — respond with a JSON array:
- { "action": "pause_ad", "ad_id": "...", "reason": "..." }
- { "action": "scale_adset", "adset_id": "...", "new_budget_pence": NUMBER, "reason": "..." }
- { "action": "rewrite_copy", "ad_id": "...", "new_headline": "...", "new_body": "...", "new_cta": "LEARN_MORE", "reason": "..." }
- { "action": "no_action", "ad_id": "...", "reason": "..." }

RULES:
- Never pause an ad with less than £5 spend (insufficient data)
- Never increase budget by more than 20% in a single action
- Never decrease budget — pause instead
- Copy rewrites will be shown to the human for approval before applying
- If CPL > £25 with £5+ spend, recommend pause_ad
- If CTR < 0.8% with £5+ spend, recommend pause_ad or rewrite_copy
- If an ad scores "good" with £10+ spend, recommend scale_adset by 20%
- Prioritise keeping at least one ad per campaign active
- Always give a plain English reason for each action

Return ONLY the JSON array. No markdown, no extra text.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { text: string }).text;
    const rawActions: OptimisationAction[] = JSON.parse(
      text.match(/\[[\s\S]*\]/)?.[0] ?? '[]',
    );

    // 3. Execute safe actions, flag copy rewrites for approval
    const results: OptimisationAction[] = [];

    for (const action of rawActions) {
      try {
        if (action.action === 'pause_ad' && action.ad_id) {
          await updateAdStatus(action.ad_id, 'PAUSED');
          results.push({ ...action, executed: true });
        } else if (action.action === 'scale_adset' && action.adset_id && action.new_budget_pence) {
          await updateAdSetBudget(action.adset_id, action.new_budget_pence);
          results.push({ ...action, executed: true });
        } else if (action.action === 'rewrite_copy') {
          // Surface for human approval — never auto-apply copy changes
          results.push({ ...action, executed: false, pendingApproval: true });
        } else {
          results.push({ ...action, executed: false });
        }
      } catch (actionErr: any) {
        console.error(`[optimise] Failed to execute ${action.action}:`, actionErr.message);
        results.push({ ...action, executed: false, reason: `${action.reason} (FAILED: ${actionErr.message})` });
      }
    }

    return NextResponse.json({ actions: results });
  } catch (err: any) {
    console.error('[meta-ads/optimise POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
