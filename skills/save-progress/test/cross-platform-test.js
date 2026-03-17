/**
 * Save Progress 跨平台兼容性测试脚本
 * 测试内容：路径处理、文件创建、脚本执行
 *
 * 运行方式：
 *   Windows: node test/cross-platform-test.js
 *   macOS/Linux: node test/cross-platform-test.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 测试结果收集
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}

console.log('='.repeat(60));
console.log('Save Progress 跨平台兼容性测试');
console.log(`平台: ${os.platform()} (${os.release()})`);
console.log(`Node.js: ${process.version}`);
console.log('='.repeat(60));
console.log();

// 测试 1: 路径分隔符处理
console.log('--- 测试路径处理 ---');

test('path.join 正确处理路径分隔符', () => {
  const result = path.join('summaries', 'test.md');
  const expected = os.platform() === 'win32' ? 'summaries\\test.md' : 'summaries/test.md';
  assertEqual(result, expected, '路径拼接结果');
});

test('path.resolve 返回绝对路径', () => {
  const result = path.resolve('summaries', 'test.md');
  assertTrue(result.includes(path.sep), '包含系统路径分隔符');
  assertTrue(path.isAbsolute(result), '返回绝对路径');
});

// 测试 2: 目录和文件操作
console.log('\n--- 测试文件系统操作 ---');

const testDir = 'test-summaries-' + Date.now();
const testFile = path.join(testDir, 'test-summary.md');

test('创建目录', () => {
  fs.mkdirSync(testDir, { recursive: true });
  assertTrue(fs.existsSync(testDir), '目录应存在');
});

test('写入文件', () => {
  fs.writeFileSync(testFile, '# Test Summary\n\nThis is a test.', 'utf8');
  assertTrue(fs.existsSync(testFile), '文件应存在');
});

test('读取文件', () => {
  const content = fs.readFileSync(testFile, 'utf8');
  assertTrue(content.includes('Test Summary'), '文件内容正确');
});

test('获取文件状态', () => {
  const stats = fs.statSync(testFile);
  assertTrue(stats.isFile(), '是文件');
  assertTrue(stats.size > 0, '文件大小大于0');
  assertTrue(stats.mtime instanceof Date, '修改时间是 Date 对象');
});

test('读取目录内容', () => {
  const files = fs.readdirSync(testDir);
  assertEqual(files.length, 1, '目录中文件数量');
  assertEqual(files[0], 'test-summary.md', '文件名匹配');
});

// 测试 3: 模拟 load-summary.js 的核心逻辑
console.log('\n--- 测试 load-summary.js 逻辑 ---');

const LAST_SUMMARY_FILE = path.join(testDir, '.last-summary');

test('写入 .last-summary 指针文件', () => {
  fs.writeFileSync(LAST_SUMMARY_FILE, path.resolve(testFile), 'utf8');
  assertTrue(fs.existsSync(LAST_SUMMARY_FILE), '指针文件存在');
});

test('读取 .last-summary 并解析路径', () => {
  const savedPath = fs.readFileSync(LAST_SUMMARY_FILE, 'utf8').trim();
  assertEqual(savedPath, path.resolve(testFile), '路径匹配');
  assertTrue(fs.existsSync(savedPath), '指向的文件存在');
});

test('查找最新文件（按修改时间）', () => {
  // 创建多个文件
  const file1 = path.join(testDir, 'summary-1.md');
  const file2 = path.join(testDir, 'summary-2.md');

  fs.writeFileSync(file1, 'First', 'utf8');
  // 确保时间差异
  const now = Date.now();
  fs.utimesSync(file1, now / 1000, now / 1000);

  fs.writeFileSync(file2, 'Second', 'utf8');

  const files = fs.readdirSync(testDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      path: path.join(testDir, f),
      mtime: fs.statSync(path.join(testDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  assertTrue(files.length >= 2, '至少找到2个文件');
  assertEqual(files[0].name, 'summary-2.md', '最新的文件是 summary-2.md');
});

// 测试 4: 路径兼容性（Windows vs Unix）
console.log('\n--- 测试跨平台路径兼容性 ---');

test('处理包含空格的路径', () => {
  const dirWithSpace = path.join(testDir, 'folder with space');
  fs.mkdirSync(dirWithSpace, { recursive: true });
  const fileWithSpace = path.join(dirWithSpace, 'file with space.md');
  fs.writeFileSync(fileWithSpace, 'content', 'utf8');
  assertTrue(fs.existsSync(fileWithSpace), '带空格的文件路径正常');
});

test('处理中文路径', () => {
  const dirWithChinese = path.join(testDir, '中文目录');
  fs.mkdirSync(dirWithChinese, { recursive: true });
  const fileWithChinese = path.join(dirWithChinese, '中文文件.md');
  fs.writeFileSync(fileWithChinese, '# 中文内容', 'utf8');
  const content = fs.readFileSync(fileWithChinese, 'utf8');
  assertTrue(content.includes('中文'), '中文内容正确读写');
});

// 测试 5: 环境变量和配置
console.log('\n--- 测试配置和环境 ---');

test('获取用户主目录', () => {
  const home = os.homedir();
  assertTrue(home.length > 0, '获取到主目录');
  console.log(`   主目录: ${home}`);
});

test('路径分隔符正确', () => {
  const sep = path.sep;
  const expected = os.platform() === 'win32' ? '\\' : '/';
  assertEqual(sep, expected, '路径分隔符匹配平台');
  console.log(`   分隔符: "${sep}"`);
});

// 清理测试文件
console.log('\n--- 清理测试文件 ---');
try {
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log(`✅ 已清理测试目录: ${testDir}`);
} catch (error) {
  console.log(`⚠️  清理警告: ${error.message}`);
}

// 输出测试总结
console.log('\n' + '='.repeat(60));
console.log('测试结果总结');
console.log('='.repeat(60));
console.log(`✅ 通过: ${results.passed}`);
console.log(`❌ 失败: ${results.failed}`);
console.log(`总计: ${results.tests.length}`);
console.log('='.repeat(60));

if (results.failed > 0) {
  console.log('\n失败的测试:');
  results.tests.filter(t => t.status === '❌ FAIL').forEach(t => {
    console.log(`  - ${t.name}: ${t.error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
}
