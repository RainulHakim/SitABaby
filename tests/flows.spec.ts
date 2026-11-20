import { test, expect } from '@playwright/test';
test('browse, filter, save, reveal contact, and discover',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.listing-card')).toHaveCount(8);
 await expect(page.getByRole('heading',{name:'Meet the little locals'})).toBeVisible();
 await page.screenshot({path:`/tmp/rent-a-baby-${testInfo.project.name}.png`});
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:`/tmp/rent-a-baby-${testInfo.project.name}-dark.png`});await page.getByRole('button',{name:'Switch to light mode'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('textbox',{name:'Search by neighborhood or city'}).fill('Brooklyn');await expect(page.locator('.listing-card')).toHaveCount(2);
 await page.locator('.listing-card').first().getByRole('button',{name:'Save listing',exact:true}).click();
 await page.getByRole('button',{name:'Clear search',exact:true}).click();
 await page.locator('.listing-card').first().locator('a').click();
 await expect(page.getByRole('button',{name:'Reveal contact · offer to sit'})).toBeVisible();
 await expect(page.getByRole('link',{name:'sarah@example.com'})).toHaveCount(0);
 await page.getByRole('button',{name:'Reveal contact · offer to sit'}).click();await expect(page.getByRole('link',{name:'sarah@example.com'})).toBeVisible();
 await page.goto('/saved');await expect(page.locator('.listing-card')).toHaveCount(1);
 await page.goto('/');await page.getByRole('button',{name:'Filters',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close filters'}).click();
 await page.getByRole('button',{name:'Discover',exact:true}).click();await expect(page.locator('.swipe-stack .listing-card')).toHaveCount(1);await page.getByRole('button',{name:'Skip listing',exact:true}).click();await expect(page.locator('.swipe-actions')).toContainText('2 of 8');
 expect(errors).toEqual([]);
});
test('create, edit, and delete a browser-owned listing',async({page})=>{
 await page.goto('/post');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jClkAAAAASUVORK5CYII=','base64');
 await page.getByLabel('Upload listing photo').setInputFiles({name:'room.png',mimeType:'image/png',buffer:png});
 await expect(page.getByAltText('Listing photo crop preview')).toBeVisible();await page.getByRole('button',{name:'Next: the little details'}).scrollIntoViewIfNeeded();console.log(await page.getByRole('button',{name:'Next: the little details'}).evaluate(el=>{const r=el.getBoundingClientRect();return JSON.stringify({rect:r.toJSON(),scroll:[scrollX,scrollY],viewport:[innerWidth,innerHeight],visual:[visualViewport?.offsetLeft,visualViewport?.offsetTop,visualViewport?.scale],hit:document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).map(e=>e.tagName+'.'+e.className)});}));await page.getByRole('button',{name:'Next: the little details'}).click();
 await page.getByLabel('Your first name').fill('Jordan');await page.getByLabel('Child’s first name').fill('Poppy');await page.getByLabel('Neighborhood / city').fill('123 Main Street');await page.getByLabel('A little about your family').fill('We would love a kind sitter for books and play on Saturday afternoons.');await page.getByRole('button',{name:'Sat',exact:true}).click();await page.getByRole('button',{name:'Afternoon',exact:true}).click();await page.getByRole('button',{name:'Next: rate & contact'}).click();await expect(page.getByRole('alert')).toContainText('without house numbers');
 await page.getByLabel('Neighborhood / city').fill('Brooklyn, NY');await page.getByRole('button',{name:'Next: rate & contact'}).click();await page.getByLabel('Email address').fill('jordan@example.com');await page.getByRole('button',{name:'Post sitting request',exact:true}).click();await page.getByRole('link',{name:'View your listing'}).click();await expect(page.getByRole('heading',{name:'Poppy',exact:true})).toBeVisible();
 await page.goto('/mine');await expect(page.locator('.listing-card')).toHaveCount(1);await page.getByRole('link',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'Next: the little details'}).click();await page.getByLabel('Child’s first name').fill('Poppy June');await page.getByRole('button',{name:'Next: rate & contact'}).click();await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.goto('/mine');await expect(page.getByRole('heading',{name:'Poppy June'})).toBeVisible();await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('button',{name:'Delete request',exact:true}).click();await expect(page.locator('.listing-card')).toHaveCount(0);
});
