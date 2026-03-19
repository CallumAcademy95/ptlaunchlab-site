import type {
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaInsights,
  AdScore,
} from './types';

const BASE = 'https://graph.facebook.com/v21.0';
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const PAGE_ID = process.env.META_PAGE_ID!;
const PIXEL_ID = '1988881834762642';

function token() {
  return process.env.META_ACCESS_TOKEN!;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function graphFetch<T>(
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const params = new URLSearchParams({ access_token: token() });

  let fetchUrl = `${url}?${params}`;
  const options: RequestInit = { method };

  if (method === 'POST' && body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  } else if (method === 'GET' && body) {
    Object.entries(body).forEach(([k, v]) =>
      params.append(k, String(v))
    );
    fetchUrl = `${url}?${params}`;
  }

  const res = await fetch(fetchUrl, options);
  const json = await res.json();

  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}${json.error.error_subcode ? ` (subcode: ${json.error.error_subcode})` : ''}${json.error.error_user_msg ? ` — ${json.error.error_user_msg}` : ''}`);
  }

  return json as T;
}

// ─── Campaigns ────────────────────────────────────────────────────────────

export async function createCampaign(name: string): Promise<{ id: string }> {
  return graphFetch(`/${AD_ACCOUNT}/campaigns`, 'POST', {
    name,
    objective: 'OUTCOME_LEADS',
    status: 'PAUSED',
    special_ad_categories: [],
  });
}

export async function getCampaigns(): Promise<MetaCampaign[]> {
  const res = await graphFetch<{ data: MetaCampaign[] }>(
    `/${AD_ACCOUNT}/campaigns`,
    'GET',
    { fields: 'id,name,status,objective,daily_budget,lifetime_budget', limit: '50' },
  );
  return res.data;
}

export async function updateCampaignStatus(
  campaignId: string,
  status: 'ACTIVE' | 'PAUSED',
): Promise<void> {
  await graphFetch(`/${campaignId}`, 'POST', { status });
}

// ─── Ad Sets ──────────────────────────────────────────────────────────────

export async function createAdSet(params: {
  name: string;
  campaignId: string;
  dailyBudgetPence: number;
  destination: 'quiz' | 'funnel';
}): Promise<{ id: string }> {
  const destinationUrl =
    params.destination === 'quiz'
      ? 'https://ptlaunchlab.co.uk/quiz'
      : 'https://ptlaunchlab.co.uk/funnel';

  return graphFetch(`/${AD_ACCOUNT}/adsets`, 'POST', {
    name: params.name,
    campaign_id: params.campaignId,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: params.dailyBudgetPence,
    destination_type: 'WEBSITE',
    is_adset_budget_sharing_enabled: false,
    targeting: {
      geo_locations: { countries: ['GB'] },
      age_min: 18,
      age_max: 45,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story'],
    },
    status: 'PAUSED',
  });
}

export async function getAdSets(campaignId: string): Promise<MetaAdSet[]> {
  const res = await graphFetch<{ data: MetaAdSet[] }>(
    `/${campaignId}/adsets`,
    'GET',
    { fields: 'id,name,status,daily_budget,campaign_id,optimization_goal' },
  );
  return res.data;
}

export async function updateAdSetStatus(
  adSetId: string,
  status: 'ACTIVE' | 'PAUSED',
): Promise<void> {
  await graphFetch(`/${adSetId}`, 'POST', { status });
}

export async function updateAdSetBudget(
  adSetId: string,
  dailyBudgetPence: number,
): Promise<void> {
  await graphFetch(`/${adSetId}`, 'POST', { daily_budget: dailyBudgetPence });
}

// ─── Ad Creatives + Ads ───────────────────────────────────────────────────

export async function uploadImage(imageUrl: string): Promise<string> {
  const res = await graphFetch<{ images: Record<string, { hash: string }> }>(
    `/${AD_ACCOUNT}/adimages`,
    'POST',
    { url: imageUrl },
  );
  const hashes = Object.values(res.images);
  if (!hashes.length) throw new Error('Image upload returned no hash');
  return hashes[0].hash;
}

export async function createAdCreative(params: {
  name: string;
  headline: string;
  primaryText: string;
  imageHash: string;
  destinationUrl: string;
  ctaType: 'LEARN_MORE' | 'SIGN_UP';
}): Promise<{ id: string }> {
  return graphFetch(`/${AD_ACCOUNT}/adcreatives`, 'POST', {
    name: params.name,
    object_story_spec: {
      page_id: PAGE_ID,
      link_data: {
        link: params.destinationUrl,
        message: params.primaryText,
        name: params.headline,
        call_to_action: {
          type: params.ctaType,
          value: { link: params.destinationUrl },
        },
        image_hash: params.imageHash,
      },
    },
    degrees_of_freedom_spec: {
      creative_features_spec: {
        standard_enhancements: { enroll_status: 'OPT_OUT' },
      },
    },
  });
}

export async function createAd(params: {
  name: string;
  adSetId: string;
  creativeId: string;
}): Promise<{ id: string }> {
  return graphFetch(`/${AD_ACCOUNT}/ads`, 'POST', {
    name: params.name,
    adset_id: params.adSetId,
    creative: { creative_id: params.creativeId },
    status: 'PAUSED',
    tracking_specs: [
      {
        'action.type': ['offsite_conversion'],
        fb_pixel: [PIXEL_ID],
      },
    ],
  });
}

export async function getAds(adSetId: string): Promise<MetaAd[]> {
  const res = await graphFetch<{ data: MetaAd[] }>(
    `/${adSetId}/ads`,
    'GET',
    { fields: 'id,name,status,adset_id,creative' },
  );
  return res.data;
}

export async function updateAdStatus(
  adId: string,
  status: 'ACTIVE' | 'PAUSED',
): Promise<void> {
  await graphFetch(`/${adId}`, 'POST', { status });
}

// ─── Insights ─────────────────────────────────────────────────────────────

function parseInsights(raw: Record<string, unknown>, datePreset: string): MetaInsights {
  const actions = (raw.actions as { action_type: string; value: string }[]) ?? [];
  const leadAction = actions.find((a) => a.action_type === 'lead');
  const leads = leadAction ? parseFloat(leadAction.value) : 0;
  const spend = parseFloat((raw.spend as string) ?? '0');

  return {
    ad_id: raw.ad_id as string | undefined,
    adset_id: raw.adset_id as string | undefined,
    campaign_id: raw.campaign_id as string | undefined,
    impressions: parseInt((raw.impressions as string) ?? '0', 10),
    clicks: parseInt((raw.clicks as string) ?? '0', 10),
    spend,
    ctr: parseFloat((raw.ctr as string) ?? '0'),
    cpc: parseFloat((raw.cpc as string) ?? '0'),
    leads,
    cpl: leads > 0 ? spend / leads : 0,
    date_start: (raw.date_start as string) ?? datePreset,
    date_stop: (raw.date_stop as string) ?? datePreset,
  };
}

export async function getAdInsights(
  adId: string,
  datePreset = 'last_7d',
): Promise<MetaInsights | null> {
  const res = await graphFetch<{ data: Record<string, unknown>[] }>(
    `/${adId}/insights`,
    'GET',
    {
      fields: 'impressions,clicks,spend,ctr,cpc,actions,ad_id',
      date_preset: datePreset,
    },
  );
  if (!res.data?.length) return null;
  return parseInsights(res.data[0], datePreset);
}

export async function getAccountInsights(
  datePreset = 'last_7d',
): Promise<MetaInsights[]> {
  const res = await graphFetch<{ data: Record<string, unknown>[] }>(
    `/${AD_ACCOUNT}/insights`,
    'GET',
    {
      fields: 'impressions,clicks,spend,ctr,cpc,actions,campaign_id',
      date_preset: datePreset,
      level: 'ad',
    },
  );
  return (res.data ?? []).map((r) => parseInsights(r, datePreset));
}

// ─── Scoring ──────────────────────────────────────────────────────────────

export function scoreAd(insights: MetaInsights): AdScore {
  if (insights.spend < 5) {
    return { score: null, label: 'insufficient', reason: 'Less than £5 spent — not enough data yet' };
  }

  let score = 50;

  // CTR
  if (insights.ctr >= 2.5) score += 25;
  else if (insights.ctr >= 1.5) score += 10;
  else if (insights.ctr < 0.8) score -= 20;
  else if (insights.ctr < 0.5) score -= 35;

  // CPL
  if (insights.leads > 0) {
    if (insights.cpl < 6) score += 25;
    else if (insights.cpl < 10) score += 10;
    else if (insights.cpl > 15) score -= 25;
    else if (insights.cpl > 25) score -= 40;
  }

  // CPC
  if (insights.cpc < 0.8) score += 10;
  else if (insights.cpc > 2.5) score -= 15;

  score = Math.max(0, Math.min(100, score));

  let label: AdScore['label'];
  if (score >= 70) label = 'good';
  else if (score >= 45) label = 'ok';
  else label = 'poor';

  const reason =
    label === 'good'
      ? `CTR ${insights.ctr.toFixed(2)}%, CPL £${insights.cpl.toFixed(2)} — performing well`
      : label === 'ok'
      ? `CTR ${insights.ctr.toFixed(2)}%, CPL £${insights.cpl.toFixed(2)} — monitor closely`
      : `CTR ${insights.ctr.toFixed(2)}%, CPL £${insights.cpl.toFixed(2)} — consider pausing`;

  return { score, label, reason };
}
