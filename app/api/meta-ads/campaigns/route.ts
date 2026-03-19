import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaigns,
  createCampaign,
  createAdSet,
  uploadImage,
  createAdCreative,
  createAd,
  updateCampaignStatus,
  updateAdSetStatus,
  updateAdStatus,
} from '@/app/lib/ads/meta';
import type { CreateCampaignParams } from '@/app/lib/ads/types';

// GET /api/meta-ads/campaigns — list all campaigns
export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json({ campaigns });
  } catch (err: any) {
    console.error('[meta-ads/campaigns GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/meta-ads/campaigns — create full campaign (campaign + adset + creative + ad)
export async function POST(req: NextRequest) {
  try {
    const body: CreateCampaignParams = await req.json();
    const { name, dailyBudgetPence, destination, headline, primaryText, imageUrl, ctaType, activateImmediately } = body;

    if (!name || !dailyBudgetPence || !headline || !primaryText || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const destinationUrl =
      destination === 'quiz'
        ? 'https://ptlaunchlab.co.uk/quiz'
        : 'https://ptlaunchlab.co.uk/funnel';

    // Step 1 — Campaign
    const campaign = await createCampaign(name);

    // Step 2 — Ad Set
    const adSet = await createAdSet({
      name: `${name} — Ad Set`,
      campaignId: campaign.id,
      dailyBudgetPence,
      destination,
    });

    // Step 3 — Upload image + create creative
    const imageHash = await uploadImage(imageUrl);
    const creative = await createAdCreative({
      name: `${name} — Creative`,
      headline,
      primaryText,
      imageHash,
      destinationUrl,
      ctaType,
    });

    // Step 4 — Ad
    const ad = await createAd({
      name: `${name} — Ad`,
      adSetId: adSet.id,
      creativeId: creative.id,
    });

    // Step 5 — Activate if requested
    if (activateImmediately) {
      await updateAdStatus(ad.id, 'ACTIVE');
      await updateAdSetStatus(adSet.id, 'ACTIVE');
      await updateCampaignStatus(campaign.id, 'ACTIVE');
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      adSetId: adSet.id,
      adId: ad.id,
      status: activateImmediately ? 'ACTIVE' : 'PAUSED',
    });
  } catch (err: any) {
    console.error('[meta-ads/campaigns POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
