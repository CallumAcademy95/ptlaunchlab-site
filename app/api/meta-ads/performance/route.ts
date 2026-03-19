import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, getAdSets, getAds, getAdInsights, getAccountInsights, scoreAd } from '@/app/lib/ads/meta';

// GET /api/meta-ads/performance?datePreset=last_7d
// Returns account-level summary + per-ad breakdown with scores
export async function GET(req: NextRequest) {
  try {
    const datePreset = req.nextUrl.searchParams.get('datePreset') ?? 'last_7d';

    // Account-level aggregate
    const allInsights = await getAccountInsights(datePreset);

    const totalSpend = allInsights.reduce((s, i) => s + i.spend, 0);
    const totalLeads = allInsights.reduce((s, i) => s + i.leads, 0);
    const totalClicks = allInsights.reduce((s, i) => s + i.clicks, 0);
    const totalImpressions = allInsights.reduce((s, i) => s + i.impressions, 0);
    const blendedCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const blendedCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const blendedCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Per-campaign with ad scores
    const campaigns = await getCampaigns();
    const campaignSummaries = await Promise.all(
      campaigns.map(async (campaign) => {
        const adsets = await getAdSets(campaign.id);
        const adScores = await Promise.all(
          adsets.flatMap(async (adset) => {
            const ads = await getAds(adset.id);
            return Promise.all(
              ads.map(async (ad) => {
                const insights = await getAdInsights(ad.id, datePreset);
                const scored = insights ? scoreAd(insights) : { score: null, label: 'insufficient' as const, reason: 'No data' };
                return { adId: ad.id, adName: ad.name, status: ad.status, insights, score: scored.label, scoreReason: scored.reason };
              }),
            );
          }),
        );

        const flat = (await Promise.all(adScores)).flat();
        const poorAds = flat.filter((a) => a.score === 'poor').length;
        const goodAds = flat.filter((a) => a.score === 'good').length;
        const health = poorAds > 0 ? 'poor' : goodAds > 0 ? 'good' : 'ok';

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          health,
          adCount: flat.length,
          ads: flat,
        };
      }),
    );

    return NextResponse.json({
      summary: {
        totalSpend: +totalSpend.toFixed(2),
        totalLeads,
        blendedCPL: +blendedCPL.toFixed(2),
        blendedCTR: +blendedCTR.toFixed(2),
        blendedCPC: +blendedCPC.toFixed(2),
        datePreset,
      },
      campaigns: campaignSummaries,
    });
  } catch (err: any) {
    console.error('[meta-ads/performance GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
