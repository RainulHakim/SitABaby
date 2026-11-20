import { test } from '@playwright/test';
test('render social card',async({page})=>{await page.setViewportSize({width:1200,height:630});await page.goto('/og-image.svg');await page.screenshot({path:'public/og-image.png'});});
