const fs = require('fs');
const path = require('path');

const LAST_SUMMARY_FILE = '.last-summary';
const SUMMARIES_DIR = 'summaries';

function findLatestSummary() {
  // 首先尝试读取 .last-summary 文件
  if (fs.existsSync(LAST_SUMMARY_FILE)) {
    const savedPath = fs.readFileSync(LAST_SUMMARY_FILE, 'utf8').trim();
    if (fs.existsSync(savedPath)) {
      return savedPath;
    }
  }

  // 如果没有 .last-summary 或文件不存在，尝试找到最新的摘要文件
  if (fs.existsSync(SUMMARIES_DIR)) {
    const files = fs.readdirSync(SUMMARIES_DIR)
      .filter(f => f.startsWith('session-summary-') && f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: path.join(SUMMARIES_DIR, f),
        mtime: fs.statSync(path.join(SUMMARIES_DIR, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > 0) {
      return files[0].path;
    }
  }

  return null;
}

function loadSummary() {
  const summaryFile = findLatestSummary();

  if (!summaryFile) {
    console.log('\n💡 提示：未找到会话摘要文件');
    console.log('   如需在 compact 后自动加载摘要，请先运行 /save-progress\n');
    process.exit(0);
  }

  try {
    const content = fs.readFileSync(summaryFile, 'utf8');

    console.log('\n' + '='.repeat(60));
    console.log('📄 已加载会话摘要：' + summaryFile);
    console.log('='.repeat(60) + '\n');

    // 显示完整内容
    console.log(content);

    console.log('\n' + '='.repeat(60));
    console.log('💡 提示：运行 /help 查看可用命令');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ 读取摘要文件失败:', error.message);
    process.exit(1);
  }
}

loadSummary();
