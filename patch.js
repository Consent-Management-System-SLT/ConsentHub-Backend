const fs = require('fs');
let c = fs.readFileSync('render-server.js', 'utf8');

c = c.replace(
  "app.set('trust proxy', true);",
  "app.set('trust proxy', 1);\n\nconst integrationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10000 });\nconst easyApplyRoutes = require('./integrations/easyapply/easyApplyIntegration.routes');\napp.use('/api/v1/integrations/easyapply', integrationLimiter, easyApplyRoutes);\nconsole.log('EasyApply integration routes mounted at /api/v1/integrations/easyapply');"
);

c = c.replace(
  "dsar: '/api/v1/dsar'",
  "dsar: '/api/v1/dsar',\n      'easyapply': '/api/v1/integrations/easyapply'"
);

c = c.replace(
  "'/api/v1/dsar'\n    ]",
  "'/api/v1/dsar',\n      '/api/v1/integrations/easyapply'\n    ]"
);

c = c.replace(
  "'/api/v1/dsar'q\n    ]",
  "'/api/v1/dsar',\n      '/api/v1/integrations/easyapply'\n    ]"
);

fs.writeFileSync('render-server.js', c);