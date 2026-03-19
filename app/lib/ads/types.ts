export interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: 'ACTIVE' | 'PAUSED';
  daily_budget: string;
  optimization_goal: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  creative: { id: string };
}

export interface MetaInsights {
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number;
  date_start: string;
  date_stop: string;
}

export interface AdScore {
  score: number | null;
  label: 'good' | 'ok' | 'poor' | 'insufficient';
  reason: string;
}

export interface OptimisationAction {
  action: 'pause_ad' | 'scale_adset' | 'rewrite_copy' | 'no_action';
  ad_id?: string;
  adset_id?: string;
  new_budget_pence?: number;
  new_headline?: string;
  new_body?: string;
  new_cta?: string;
  reason: string;
  executed: boolean;
  pendingApproval?: boolean;
}

export interface CreateCampaignParams {
  name: string;
  dailyBudgetPence: number;
  destination: 'quiz' | 'funnel';
  headline: string;
  primaryText: string;
  imageUrl: string;
  ctaType: 'LEARN_MORE' | 'SIGN_UP';
  activateImmediately: boolean;
}

export interface AdWithInsights extends MetaAd {
  insights: MetaInsights | null;
  score: AdScore;
}

export interface CampaignDetail extends MetaCampaign {
  adsets: (MetaAdSet & { ads: AdWithInsights[] })[];
  insights: MetaInsights | null;
}
