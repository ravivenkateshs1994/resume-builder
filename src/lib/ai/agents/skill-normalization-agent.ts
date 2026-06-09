/**
 * SkillNormalizationAgent
 *
 * Deterministic LangGraph node that canonicalizes, deduplicates, and
 * cross-categorizes a raw SkillExtractionAgentOutput into a clean,
 * consistent skill inventory.
 *
 * Design rationale: Normalization is a deterministic transform — using an LLM
 * for this step introduces latency, cost, and hallucination risk with no
 * accuracy benefit over a well-curated canonical alias map. This node runs
 * synchronously with zero API calls, eliminating a failure point from the
 * pipeline while providing higher throughput.
 *
 * Features:
 *  • 200+ alias mappings for programming languages, frameworks, tools, clouds
 *  • Cross-category deduplication (same skill in multiple categories → keep highest-confidence)
 *  • Proficiency signal consolidation (explicit > inferred > mentioned)
 *  • yearsEvidence aggregation (sum across duplicate entries)
 *  • Category reassignment for common miscategorizations
 *  • LangGraph node interface (runAsNode → Partial<PipelineState>)
 *
 * Server-only. Never import from client components.
 */

import type { PipelineState, PipelineError } from "../graphs/state";
import type { NodeFn } from "../graphs/nodes";
import type {
  SkillExtractionAgentOutput,
  SkillEntry,
} from "./skill-extraction-agent";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — CANONICAL ALIAS MAP
// Keys: lowercase variants. Values: canonical display name.
// ─────────────────────────────────────────────────────────────────────────────

const ALIAS_MAP: Readonly<Record<string, string>> = {
  // JavaScript ecosystem
  js: "JavaScript",
  javascript: "JavaScript",
  "node.js": "Node.js",
  nodejs: "Node.js",
  node: "Node.js",
  ts: "TypeScript",
  typescript: "TypeScript",
  react: "React",
  reactjs: "React",
  "react.js": "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  next: "Next.js",
  "vue.js": "Vue.js",
  vuejs: "Vue.js",
  vue: "Vue.js",
  nuxt: "Nuxt.js",
  "nuxt.js": "Nuxt.js",
  nuxtjs: "Nuxt.js",
  angular: "Angular",
  angularjs: "AngularJS",
  "angular.js": "AngularJS",
  svelte: "Svelte",
  "svelte.js": "Svelte",
  sveltekit: "SvelteKit",
  remix: "Remix",
  astro: "Astro",
  express: "Express.js",
  "express.js": "Express.js",
  expressjs: "Express.js",
  fastify: "Fastify",
  nestjs: "NestJS",
  "nest.js": "NestJS",
  hapi: "Hapi.js",
  "hapi.js": "Hapi.js",
  koa: "Koa.js",
  "koa.js": "Koa.js",
  vite: "Vite",
  webpack: "Webpack",
  rollup: "Rollup",
  esbuild: "esbuild",
  bun: "Bun",
  deno: "Deno",
  jest: "Jest",
  vitest: "Vitest",
  "testing-library": "Testing Library",
  playwright: "Playwright",
  cypress: "Cypress",

  // Python ecosystem
  python: "Python",
  py: "Python",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  "fast api": "FastAPI",
  sqlalchemy: "SQLAlchemy",
  pydantic: "Pydantic",
  celery: "Celery",
  pandas: "Pandas",
  numpy: "NumPy",
  scipy: "SciPy",
  matplotlib: "Matplotlib",
  seaborn: "Seaborn",
  sklearn: "scikit-learn",
  "scikit-learn": "scikit-learn",
  "scikit learn": "scikit-learn",
  tensorflow: "TensorFlow",
  tf: "TensorFlow",
  pytorch: "PyTorch",
  "py torch": "PyTorch",
  torch: "PyTorch",
  keras: "Keras",
  huggingface: "Hugging Face",
  "hugging face": "Hugging Face",
  langchain: "LangChain",
  "lang chain": "LangChain",
  llamaindex: "LlamaIndex",
  "llama index": "LlamaIndex",

  // Go
  go: "Go",
  golang: "Go",

  // Rust
  rust: "Rust",
  "rust lang": "Rust",

  // Java ecosystem
  java: "Java",
  "spring boot": "Spring Boot",
  springboot: "Spring Boot",
  spring: "Spring",
  "spring framework": "Spring",
  maven: "Maven",
  gradle: "Gradle",
  hibernate: "Hibernate",
  quarkus: "Quarkus",
  micronaut: "Micronaut",

  // .NET ecosystem
  "c#": "C#",
  csharp: "C#",
  ".net": ".NET",
  dotnet: ".NET",
  "asp.net": "ASP.NET",
  aspnet: "ASP.NET",
  "asp.net core": "ASP.NET Core",
  "aspnet core": "ASP.NET Core",
  blazor: "Blazor",
  "entity framework": "Entity Framework",
  ef: "Entity Framework",
  "ef core": "EF Core",

  // PHP ecosystem
  php: "PHP",
  laravel: "Laravel",
  symfony: "Symfony",
  wordpress: "WordPress",

  // Ruby ecosystem
  ruby: "Ruby",
  rails: "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",

  // Mobile
  swift: "Swift",
  "objective-c": "Objective-C",
  "obj-c": "Objective-C",
  kotlin: "Kotlin",
  "react native": "React Native",
  "react-native": "React Native",
  flutter: "Flutter",
  dart: "Dart",
  "ionic framework": "Ionic",
  ionic: "Ionic",
  expo: "Expo",

  // Systems
  c: "C",
  "c++": "C++",
  cpp: "C++",
  "c plus plus": "C++",
  assembly: "Assembly",
  asm: "Assembly",

  // Data & Analytics
  sql: "SQL",
  "pl/sql": "PL/SQL",
  plsql: "PL/SQL",
  "t-sql": "T-SQL",
  tsql: "T-SQL",
  spark: "Apache Spark",
  "apache spark": "Apache Spark",
  hadoop: "Hadoop",
  "apache hadoop": "Hadoop",
  kafka: "Apache Kafka",
  "apache kafka": "Apache Kafka",
  airflow: "Apache Airflow",
  "apache airflow": "Apache Airflow",
  dbt: "dbt",
  "data build tool": "dbt",
  looker: "Looker",
  tableau: "Tableau",
  "power bi": "Power BI",
  powerbi: "Power BI",
  superset: "Apache Superset",
  "apache superset": "Apache Superset",

  // Databases
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  pg: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
  mssql: "Microsoft SQL Server",
  "sql server": "Microsoft SQL Server",
  "microsoft sql server": "Microsoft SQL Server",
  oracle: "Oracle DB",
  sqlite: "SQLite",
  mongo: "MongoDB",
  mongodb: "MongoDB",
  "mongo db": "MongoDB",
  redis: "Redis",
  elasticsearch: "Elasticsearch",
  "elastic search": "Elasticsearch",
  opensearch: "OpenSearch",
  cassandra: "Apache Cassandra",
  "apache cassandra": "Apache Cassandra",
  dynamodb: "DynamoDB",
  "dynamo db": "DynamoDB",
  firestore: "Firestore",
  "cloud firestore": "Firestore",
  supabase: "Supabase",
  planetscale: "PlanetScale",
  cockroachdb: "CockroachDB",
  neo4j: "Neo4j",
  arangodb: "ArangoDB",
  influxdb: "InfluxDB",
  "time series db": "InfluxDB",
  prisma: "Prisma",
  drizzle: "Drizzle ORM",
  "drizzle orm": "Drizzle ORM",
  typeorm: "TypeORM",
  "type orm": "TypeORM",
  sequelize: "Sequelize",

  // Cloud – AWS
  aws: "AWS",
  "amazon web services": "AWS",
  "amazon aws": "AWS",
  ec2: "AWS EC2",
  "aws ec2": "AWS EC2",
  s3: "AWS S3",
  "aws s3": "AWS S3",
  lambda: "AWS Lambda",
  "aws lambda": "AWS Lambda",
  rds: "AWS RDS",
  "aws rds": "AWS RDS",
  ecs: "AWS ECS",
  "aws ecs": "AWS ECS",
  eks: "AWS EKS",
  "aws eks": "AWS EKS",
  cloudfront: "AWS CloudFront",
  "aws cloudfront": "AWS CloudFront",
  sqs: "AWS SQS",
  "aws sqs": "AWS SQS",
  sns: "AWS SNS",
  "aws sns": "AWS SNS",
  api_gateway: "AWS API Gateway",
  "api gateway": "AWS API Gateway",
  "aws api gateway": "AWS API Gateway",
  "aws glue": "AWS Glue",
  "aws athena": "AWS Athena",
  "aws redshift": "AWS Redshift",
  redshift: "AWS Redshift",
  "aws bedrock": "AWS Bedrock",
  bedrock: "AWS Bedrock",

  // Cloud – GCP
  gcp: "GCP",
  "google cloud": "GCP",
  "google cloud platform": "GCP",
  gke: "GKE",
  "google kubernetes engine": "GKE",
  "cloud run": "Cloud Run",
  "google cloud run": "Cloud Run",
  bigquery: "BigQuery",
  "big query": "BigQuery",
  "google bigquery": "BigQuery",
  "cloud functions": "Cloud Functions",
  "google cloud functions": "Cloud Functions",
  "cloud storage": "Google Cloud Storage",
  "google cloud storage": "Google Cloud Storage",
  "vertex ai": "Vertex AI",
  "google vertex ai": "Vertex AI",
  "cloud spanner": "Cloud Spanner",

  // Cloud – Azure
  azure: "Azure",
  "microsoft azure": "Azure",
  "azure functions": "Azure Functions",
  "azure devops": "Azure DevOps",
  "azure kubernetes service": "AKS",
  aks: "AKS",
  "azure cosmos db": "Azure Cosmos DB",
  cosmosdb: "Azure Cosmos DB",
  "cosmos db": "Azure Cosmos DB",
  "azure blob storage": "Azure Blob Storage",
  "azure service bus": "Azure Service Bus",

  // Cloud – Other
  vercel: "Vercel",
  netlify: "Netlify",
  heroku: "Heroku",
  digitalocean: "DigitalOcean",
  "digital ocean": "DigitalOcean",
  "linode / akamai": "Linode",
  linode: "Linode",
  "cloudflare workers": "Cloudflare Workers",
  cloudflare: "Cloudflare",
  "fly.io": "Fly.io",
  flyio: "Fly.io",
  render: "Render",

  // DevOps & Infra
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  k8: "Kubernetes",
  helm: "Helm",
  terraform: "Terraform",
  "terraform cloud": "Terraform Cloud",
  pulumi: "Pulumi",
  ansible: "Ansible",
  "ansible playbook": "Ansible",
  puppet: "Puppet",
  chef: "Chef",
  vagrant: "Vagrant",
  packer: "Packer",
  "github actions": "GitHub Actions",
  "gh actions": "GitHub Actions",
  "gitlab ci": "GitLab CI",
  "gitlab ci/cd": "GitLab CI",
  "circle ci": "CircleCI",
  circleci: "CircleCI",
  jenkins: "Jenkins",
  "travis ci": "Travis CI",
  travisci: "Travis CI",
  argocd: "ArgoCD",
  "argo cd": "ArgoCD",
  flux: "Flux",
  "flux cd": "Flux",
  prometheus: "Prometheus",
  grafana: "Grafana",
  "elk stack": "ELK Stack",
  elasticsearch_logstash: "ELK Stack",
  datadog: "Datadog",
  "new relic": "New Relic",
  newrelic: "New Relic",
  splunk: "Splunk",
  "open telemetry": "OpenTelemetry",
  opentelemetry: "OpenTelemetry",
  otel: "OpenTelemetry",
  nginx: "NGINX",
  apache: "Apache HTTP Server",
  "apache httpd": "Apache HTTP Server",
  haproxy: "HAProxy",
  "load balancer": "Load Balancing",
  "service mesh": "Service Mesh",
  istio: "Istio",
  linkerd: "Linkerd",
  consul: "Consul",
  vault: "HashiCorp Vault",
  "hashicorp vault": "HashiCorp Vault",
  "hashicorp terraform": "Terraform",

  // Version Control
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  "azure repos": "Azure Repos",
  svn: "SVN",
  "subversion": "SVN",

  // API & Integration
  rest: "REST APIs",
  "rest api": "REST APIs",
  "restful api": "REST APIs",
  "rest apis": "REST APIs",
  graphql: "GraphQL",
  grpc: "gRPC",
  "g rpc": "gRPC",
  "protocol buffers": "Protocol Buffers",
  protobuf: "Protocol Buffers",
  "proto buf": "Protocol Buffers",
  websockets: "WebSockets",
  websocket: "WebSockets",
  "web sockets": "WebSockets",
  mqtt: "MQTT",
  amqp: "AMQP",
  rabbitmq: "RabbitMQ",
  "rabbit mq": "RabbitMQ",
  nats: "NATS",
  openapi: "OpenAPI",
  "open api": "OpenAPI",
  swagger: "Swagger / OpenAPI",

  // AI / ML
  openai: "OpenAI API",
  "openai api": "OpenAI API",
  "gpt-4": "GPT-4",
  gpt4: "GPT-4",
  "llm": "LLMs",
  "large language model": "LLMs",
  "large language models": "LLMs",
  "prompt engineering": "Prompt Engineering",
  rag: "RAG",
  "retrieval augmented generation": "RAG",
  "vector database": "Vector Databases",
  "vector db": "Vector Databases",
  pinecone: "Pinecone",
  weaviate: "Weaviate",
  chroma: "Chroma",
  "chroma db": "Chroma",
  qdrant: "Qdrant",

  // Methodologies (soft)
  agile: "Agile",
  scrum: "Scrum",
  kanban: "Kanban",
  tdd: "TDD",
  "test driven development": "TDD",
  bdd: "BDD",
  "behavior driven development": "BDD",
  "ci/cd": "CI/CD",
  "continuous integration": "CI/CD",
  devops: "DevOps",
  "dev ops": "DevOps",
  devsecops: "DevSecOps",
  "site reliability engineering": "SRE",
  sre: "SRE",
  ddd: "Domain-Driven Design",
  "domain driven design": "Domain-Driven Design",
  microservices: "Microservices",
  "micro services": "Microservices",
  "event driven": "Event-Driven Architecture",
  "event-driven architecture": "Event-Driven Architecture",
  eda: "Event-Driven Architecture",
  "clean architecture": "Clean Architecture",
  "hexagonal architecture": "Hexagonal Architecture",
  "cqrs": "CQRS",
  "command query responsibility segregation": "CQRS",
  "event sourcing": "Event Sourcing",
};

// Skills that are methodologies regardless of what category extraction placed them in
const METHODOLOGY_SKILLS = new Set([
  "Agile",
  "Scrum",
  "Kanban",
  "TDD",
  "BDD",
  "CI/CD",
  "DevOps",
  "DevSecOps",
  "SRE",
  "Domain-Driven Design",
  "CQRS",
  "Event Sourcing",
  "Event-Driven Architecture",
  "Microservices",
  "Clean Architecture",
  "Hexagonal Architecture",
]);

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — OUTPUT TYPE (re-uses SkillExtractionAgentOutput shape)
// ─────────────────────────────────────────────────────────────────────────────

export type NormalizedSkillInventory = SkillExtractionAgentOutput;

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — NORMALIZATION LOGIC
// ─────────────────────────────────────────────────────────────────────────────

function canonicalize(name: string): string {
  const key = name.trim().toLowerCase();
  return ALIAS_MAP[key] ?? toTitleCase(name.trim());
}

function toTitleCase(s: string): string {
  // Preserve known all-caps acronyms
  const UPPER_WORDS = new Set([
    "API", "APIs", "AWS", "GCP", "SQL", "HTML", "CSS", "JWT", "REST",
    "HTTP", "HTTPS", "JSON", "XML", "YAML", "SDK", "CLI", "UI", "UX",
    "CI", "CD", "TDD", "BDD", "SRE", "ORM", "OOP", "FP", "MVP",
    "CQRS", "DDD", "EDA", "AMQP", "MQTT", "gRPC",
  ]);

  return s
    .split(/\s+/)
    .map((word) =>
      UPPER_WORDS.has(word.toUpperCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

const SIGNAL_RANK: Record<SkillEntry["proficiencySignal"], number> = {
  explicit: 3,
  inferred: 2,
  mentioned: 1,
};

/** Merge duplicate entries: keep highest proficiency signal, sum yearsEvidence. */
function mergeEntries(entries: SkillEntry[]): SkillEntry[] {
  const map = new Map<string, SkillEntry>();

  for (const entry of entries) {
    const canonical = canonicalize(entry.name);
    const existing = map.get(canonical);

    if (!existing) {
      map.set(canonical, { ...entry, name: canonical });
    } else {
      const bestSignal =
        SIGNAL_RANK[entry.proficiencySignal] >
        SIGNAL_RANK[existing.proficiencySignal]
          ? entry.proficiencySignal
          : existing.proficiencySignal;

      const combinedYears =
        entry.yearsEvidence !== null && existing.yearsEvidence !== null
          ? Math.max(entry.yearsEvidence, existing.yearsEvidence)
          : entry.yearsEvidence ?? existing.yearsEvidence;

      map.set(canonical, {
        name: canonical,
        proficiencySignal: bestSignal,
        yearsEvidence: combinedYears,
      });
    }
  }

  // Sort: explicit first, then by yearsEvidence desc
  return Array.from(map.values()).sort((a, b) => {
    const rankDiff =
      SIGNAL_RANK[b.proficiencySignal] - SIGNAL_RANK[a.proficiencySignal];
    if (rankDiff !== 0) return rankDiff;
    return (b.yearsEvidence ?? 0) - (a.yearsEvidence ?? 0);
  });
}

function normalizeStringList(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const canonical = canonicalize(item);
    if (!seen.has(canonical)) {
      seen.add(canonical);
      result.push(canonical);
    }
  }

  return result;
}

function normalizeInventory(
  raw: SkillExtractionAgentOutput
): NormalizedSkillInventory {
  // First pass: canonicalize all entries per-category
  const technicalSkills = mergeEntries(raw.technicalSkills);
  const frameworks = mergeEntries(raw.frameworks);
  const tools = mergeEntries(raw.tools);
  const cloudPlatforms = mergeEntries(raw.cloudPlatforms);
  const databases = mergeEntries(raw.databases);
  const softSkills = normalizeStringList(raw.softSkills);
  const certifications = normalizeStringList(raw.certifications);
  const methodologies = normalizeStringList(raw.methodologies);
  const primaryLanguages = normalizeStringList(raw.primaryLanguages);

  // Second pass: move skills that are misclassified methodologies
  // (e.g. "Agile" in technicalSkills → move to methodologies)
  const extractMethodologies = (entries: SkillEntry[]): [SkillEntry[], string[]] => {
    const kept: SkillEntry[] = [];
    const promoted: string[] = [];
    for (const e of entries) {
      if (METHODOLOGY_SKILLS.has(e.name)) {
        promoted.push(e.name);
      } else {
        kept.push(e);
      }
    }
    return [kept, promoted];
  };

  const [cleanTechnical, techMethodologies] = extractMethodologies(technicalSkills);
  const [cleanFrameworks, fwMethodologies] = extractMethodologies(frameworks);
  const [cleanTools, toolMethodologies] = extractMethodologies(tools);

  const allMethodologies = normalizeStringList([
    ...methodologies,
    ...techMethodologies,
    ...fwMethodologies,
    ...toolMethodologies,
  ]);

  // Third pass: resolve cross-category duplicates
  // A skill in cloudPlatforms should not also appear in technicalSkills
  const cloudNames = new Set(cloudPlatforms.map((e) => e.name));
  const dbNames = new Set(databases.map((e) => e.name));

  const finalTechnical = cleanTechnical.filter(
    (e) => !cloudNames.has(e.name) && !dbNames.has(e.name)
  );
  const finalFrameworks = cleanFrameworks.filter(
    (e) => !cloudNames.has(e.name) && !dbNames.has(e.name)
  );
  const finalTools = cleanTools.filter(
    (e) => !cloudNames.has(e.name) && !dbNames.has(e.name)
  );

  return {
    technicalSkills: finalTechnical,
    frameworks: finalFrameworks,
    tools: finalTools,
    cloudPlatforms,
    databases,
    softSkills,
    certifications,
    methodologies: allMethodologies,
    primaryLanguages,
    senioritySummary: raw.senioritySummary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SkillNormalizationErrorKind = "empty_input" | "normalization_failed";

export class SkillNormalizationError extends Error {
  readonly kind: SkillNormalizationErrorKind;
  readonly traceId: string | undefined;

  constructor(kind: SkillNormalizationErrorKind, message: string, traceId?: string) {
    super(message);
    this.name = "SkillNormalizationError";
    this.kind = kind;
    this.traceId = traceId;
  }
}

export interface SkillNormalizationSuccess {
  success: true;
  data: NormalizedSkillInventory;
  inputSkillCount: number;
  outputSkillCount: number;
  durationMs: number;
  aliasesResolved: number;
  duplicatesRemoved: number;
}

export interface SkillNormalizationFailure {
  success: false;
  error: SkillNormalizationError;
}

export type SkillNormalizationResult =
  | SkillNormalizationSuccess
  | SkillNormalizationFailure;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — AGENT CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class SkillNormalizationAgent {
  run(input: SkillExtractionAgentOutput): SkillNormalizationResult {
    const start = Date.now();

    const inputSkillCount =
      input.technicalSkills.length +
      input.frameworks.length +
      input.tools.length +
      input.cloudPlatforms.length +
      input.databases.length;

    if (inputSkillCount === 0 && input.softSkills.length === 0) {
      return {
        success: false,
        error: new SkillNormalizationError(
          "empty_input",
          "Skill inventory is empty — nothing to normalize."
        ),
      };
    }

    try {
      const normalized = normalizeInventory(input);

      const outputSkillCount =
        normalized.technicalSkills.length +
        normalized.frameworks.length +
        normalized.tools.length +
        normalized.cloudPlatforms.length +
        normalized.databases.length;

      // Count resolved aliases by comparing original names to canonical
      let aliasesResolved = 0;
      const allRaw = [
        ...input.technicalSkills,
        ...input.frameworks,
        ...input.tools,
        ...input.cloudPlatforms,
        ...input.databases,
      ];
      for (const entry of allRaw) {
        const canonical = canonicalize(entry.name);
        if (canonical !== entry.name.trim()) aliasesResolved++;
      }

      return {
        success: true,
        data: normalized,
        inputSkillCount,
        outputSkillCount,
        durationMs: Date.now() - start,
        aliasesResolved,
        duplicatesRemoved: Math.max(0, inputSkillCount - outputSkillCount),
      };
    } catch (err) {
      return {
        success: false,
        error: new SkillNormalizationError(
          "normalization_failed",
          err instanceof Error ? err.message : String(err)
        ),
      };
    }
  }

  /**
   * LangGraph-compatible node function.
   *
   * Reads:  state.enrichedSkills
   * Writes: state.normalizedSkills
   *
   * If enrichedSkills is missing, appends an error and returns empty partial.
   * Normalization failure is non-fatal: logs warning but does not block the pipeline.
   */
  runAsNode(state: PipelineState): Partial<PipelineState> {
    if (!state.enrichedSkills) {
      return appendError(
        state,
        "skillNormalizationNode",
        "state.enrichedSkills is not available. Run skillExtractionNode first."
      );
    }

    const result = this.run(state.enrichedSkills);

    if (!result.success) {
      // Non-fatal: log error but fall back to raw enrichedSkills
      console.warn(
        `[SkillNormalizationAgent] Normalization failed (${result.error.kind}): ` +
          `${result.error.message}. Falling back to raw enrichedSkills.`
      );
      return { normalizedSkills: state.enrichedSkills };
    }

    if (
      process.env.NODE_ENV !== "production" &&
      (result.aliasesResolved > 0 || result.duplicatesRemoved > 0)
    ) {
      console.debug(
        `[SkillNormalizationAgent] Normalized ${result.inputSkillCount} → ` +
          `${result.outputSkillCount} skills. ` +
          `Aliases resolved: ${result.aliasesResolved}, ` +
          `Duplicates removed: ${result.duplicatesRemoved}. ` +
          `Duration: ${result.durationMs}ms.`
      );
    }

    return { normalizedSkills: result.data };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — LANGGRAPH NODE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in LangGraph node. Synchronous — zero API latency.
 *
 * Reads:  state.enrichedSkills
 * Writes: state.normalizedSkills
 *
 * @example
 * ```ts
 * const graph = new PipelineGraphBuilder()
 *   .addNode({ name: "extractSkills",    fn: skillExtractionNode,    dependencies: ["parseResume"] })
 *   .addNode({ name: "normalizeSkills",  fn: skillNormalizationNode, dependencies: ["extractSkills"] })
 *   .compile();
 * ```
 */
export const skillNormalizationNode: NodeFn = (state) =>
  Promise.resolve(skillNormalizationAgent.runAsNode(state));

// ─────────────────────────────────────────────────────────────────────────────
// § 7 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function appendError(
  state: PipelineState,
  node: string,
  message: string
): Partial<PipelineState> {
  const entry: PipelineError = {
    node,
    message,
    timestamp: new Date().toISOString(),
  };
  return { errors: [...state.errors, entry] };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8 — SINGLETON
// ─────────────────────────────────────────────────────────────────────────────

export const skillNormalizationAgent = new SkillNormalizationAgent();
