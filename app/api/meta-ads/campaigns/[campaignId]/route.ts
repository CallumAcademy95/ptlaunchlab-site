import { NextRequest, NextResponse } from 'next/server';
import {
  getAdSets,
  getAds,
  getAdInsights,
  scoreAd,
  updateCampaignStatus,
  updateAdSetStatus,
  updateAdStatus,
} from '@/app/lib/ads/meta';
import type { CampaignDetail, AdWithInsights } from '@/app/lib/ads/types';

// GET /api/meta-ads/campaigns/[campaignId] — full campaign detail with insights
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const { campaignId } = await params;
    const adsets = await getAdSets(campaignId);

    const enrichedAdsets = await Promise.all(
      adsets.map(async (adset) => {
        const ads = await getAds(adset.id);
        const enrichedAds: AdWithInsights[] = await Promise.all(
          ads.map(async (ad) => {
            const insights = await getAdInsights(ad.id);
            const score = insights ? scoreAd(insights) : { score: null, label: 'insufficient' as const, reason: 'No data yet' };
            return { ...ad, insights, score };
          }),
        );
        return { ...adset, ads: enrichedAds };
      }),
    );

    return NextResponse.json({ campaignId, adsets: enrichedAdsets });
  } catch (err: any) {
    console.error('[meta-ads/campaigns/[campaignId] GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/meta-ads/campaigns/[campaignId] — toggle campaign/adset/ad status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const { campaignId } = await params;
    const { type, id, status } = await req.json();

    if (type === 'campaign') await updateCampaignStatus(campaignId, status);
    else if (type === 'adset') await updateAdSetStatus(id, status);
    else if (type === 'ad') await updateAdStatus(id, status);
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[meta-ads/campaigns/[campaignId] PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
