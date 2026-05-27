import * as analysis from "../analyses/route";

// Proxy /api/cloud/analysis to the canonical /api/cloud/analyses handlers
export const GET = analysis.GET;
export const POST = analysis.POST;
