import * as analysisId from "../../analyses/[id]/route";

// Proxy DELETE for /api/cloud/analysis/[id] to the analyses/[id] handler
export const DELETE = analysisId.DELETE;
