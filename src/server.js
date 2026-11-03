const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, config.host, () => {
  console.log('====================================================');
  console.log(`🚀 AttendEase Server running smoothly!`);
  console.log(`📍 Local URL:     http://localhost:${config.port}`);
  console.log(`🌐 Environment:   ${config.env}`);
  console.log(`📊 Mode:          Production-Ready REST Backend`);
  console.log(`🎓 Project:       ${config.projectMeta.title}`);
  console.log(`👤 Student:       ${config.projectMeta.student.name} (${config.projectMeta.student.roll})`);
  console.log('====================================================');
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
