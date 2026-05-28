import fs from 'fs';
const report = JSON.parse(fs.readFileSync('./axe-report.json','utf8'));
const viol = report.violations || [];
const summary = viol.map(v => ({
  id: v.id,
  impact: v.impact,
  nodes: v.nodes.length,
  examples: v.nodes.slice(0,5).map(n => ({ html: n.html, target: n.target }))
}));
console.log(JSON.stringify(summary, null, 2));
