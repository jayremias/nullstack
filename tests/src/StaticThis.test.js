describe('StaticThis ssr', () => {

  beforeAll(async () => {
    await page.goto('http://localhost:6969/static-this');
  });

  test('this is bound to the class in server functions', async () => {
    const element = await page.$('[data-name]');
    expect(element).toBeTruthy();  
  });

});

describe('StaticThis spa', () => {

  beforeAll(async () => {
    await page.goto('http://localhost:6969/');
    await page.click('[href="/static-this"]');
  });

  test('this is bound to the class in server functions', async () => {
    await page.waitForSelector('[data-name]');
    const element = await page.$('[data-name]');
    expect(element).toBeTruthy();  
  });

});