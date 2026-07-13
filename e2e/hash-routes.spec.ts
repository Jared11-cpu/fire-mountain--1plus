import { expect, test } from '@playwright/test';

test('HashRouter direct refresh and browser history', async ({ page }) => {
  await page.goto('/#/planner');
  await expect(page.getByRole('heading', { name: '懂你，也懂湖北' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('开始日期')).toBeVisible();
  await page.getByRole('button', { name: '旅行手账' }).click();
  await expect(page).toHaveURL(/#\/journal$/);
  await expect(page.getByText('0 条真实记录')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/planner$/);
  await page.goto('/#/about');
  await page.reload();
  await expect(page.getByRole('heading', { name: '系统架构图' })).toBeVisible();
});

test('natural language acceptance case stays synchronized', async ({ page }) => {
  await page.goto('/#/planner');
  const prompt = page.getByLabel('用一句话描述旅行需求');
  await prompt.fill('恩施三天两夜，预算1000元，喜欢峡谷和拍照，不吃辣');
  await page.getByRole('button', { name: '识别条件' }).click();
  await expect(page.getByText('城市：恩施')).toBeVisible();
  await expect(page.getByText('天数：3天')).toBeVisible();
  await expect(page.getByText('预算：1000元')).toBeVisible();
  await expect(page.getByText('兴趣：自然风光')).toBeVisible();
  await expect(page.getByText('饮食限制：不吃辣')).toBeVisible();
  await expect(page.getByLabel('天数')).toHaveValue('3');
  await expect(page.getByLabel('预算（元）')).toHaveValue('1000');
});

test('edits survive detail tab switches and refresh', async ({ page }) => {
  await page.goto('/#/planner');
  await page.getByRole('button', { name: '规则引擎生成演示' }).click();
  await page.getByRole('button', { name: '行程记录' }).click();
  const note = page.getByLabel('第1天手记');
  await note.fill('切换标签后必须保留');
  await page.getByRole('button', { name: '天气' }).click();
  await page.getByRole('button', { name: '行程记录' }).click();
  await expect(page.getByLabel('第1天手记')).toHaveValue('切换标签后必须保留');
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByRole('button', { name: '行程记录' }).click();
  await expect(page.getByLabel('第1天手记')).toHaveValue('切换标签后必须保留');
});

test('overview metrics are directly editable and persist', async ({ page }) => {
  await page.goto('/#/planner');
  await page.getByRole('button', { name: '规则引擎生成演示' }).click();
  await expect(page.getByText('当前为规则引擎生成演示', { exact: false })).toHaveCount(0);
  await expect(page.getByText('RULES-BASED TRAVEL PLANNER', { exact: true })).toHaveCount(0);
  await expect(page.getByText('已根据当前确认参数生成规则路线。', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '分享' })).toHaveCount(0);

  await page.getByLabel('总览点位').fill('4');
  await page.getByLabel('总览点位').press('Enter');
  await page.getByLabel('总览预计时长').fill('6.5');
  await page.getByLabel('总览预计时长').press('Enter');
  await page.getByLabel('总览预算总计').fill('750');
  await page.getByLabel('总览预算总计').press('Enter');
  await page.getByLabel('总览出发日期').fill('2026-08-01');
  await page.waitForTimeout(900);

  await page.reload();
  await expect(page.getByLabel('总览点位')).toHaveValue('4');
  await expect(page.getByLabel('总览预计时长')).toHaveValue('6.5');
  await expect(page.getByLabel('总览预算总计')).toHaveValue('750');
  await expect(page.getByLabel('总览出发日期')).toHaveValue('2026-08-01');
});

test('route detail keeps map fixed and saves expanded place arrangements', async ({ page }) => {
  await page.goto('/#/planner');
  await page.getByRole('button', { name: '规则引擎生成演示' }).click();
  await expect(page.getByText('已保存方案 · 自动同步')).toBeVisible();
  await page.getByRole('button', { name: '路线' }).click();
  await expect(page.getByText('已保存方案 · 自动同步')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '地点安排' })).toBeVisible();

  const map = page.getByRole('region', { name: '路线地图' });
  const initialHeight = (await map.boundingBox())?.height;
  await expect(page.getByAltText('宜昌东站地点照片')).toBeVisible();
  await expect(page.getByText('我的地点安排')).toBeVisible();
  await page.getByLabel('我的安排').fill('提前十分钟到达，先拍站牌再集合。');
  await page.getByLabel('停留分钟').fill('25');
  await page.getByLabel('停留分钟').blur();
  await page.getByLabel('方案详情', { exact: true }).evaluate((element) => { const scroller = element.querySelector('[class*="overflow-y-auto"]'); if (scroller) scroller.scrollTop = scroller.scrollHeight; });
  expect((await map.boundingBox())?.height).toBe(initialHeight);

  await page.getByRole('button', { name: '概览' }).click();
  await page.getByRole('button', { name: '路线' }).click();
  await expect(page.getByLabel('我的安排')).toHaveValue('提前十分钟到达，先拍站牌再集合。');
  await expect(page.getByLabel('停留分钟')).toHaveValue('25');
});

test('daily paper tasks can be completed and edited persistently', async ({ page }) => {
  await page.goto('/#/planner');
  await page.getByRole('button', { name: '规则引擎生成演示' }).click();
  await page.getByRole('button', { name: '行程记录' }).click();
  await expect(page.getByText('已保存方案 · 自动同步')).toHaveCount(0);
  await page.getByRole('button', { name: '完成宜昌东站' }).click();
  await expect(page.getByRole('button', { name: '取消完成宜昌东站' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '编辑宜昌东站' }).click();
  await page.getByLabel('修改宜昌东站时间').fill('09:05');
  await page.getByLabel('修改宜昌东站任务').fill('宜昌东站集合');
  await page.getByRole('button', { name: '完成编辑宜昌东站集合' }).click();
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByRole('button', { name: '行程记录' }).click();
  const completedTask = page.getByRole('button', { name: '取消完成宜昌东站集合' });
  await expect(completedTask).toBeVisible();
  await expect(completedTask).toContainText('09:05');
});

