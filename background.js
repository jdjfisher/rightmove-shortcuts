async function hidePropertyCommand() {
  const tab = await getCurrentTab();

  const id = await getPropertyId(tab.url);

  if (!id) {
    return;
  }

  await hidePropertyForAuthenticatedUser(id);

  await browser.tabs.remove(tab.id);

  // Refresh any search tabs
  const searchTabs = await queryMultipleUrls([
    '*://www.rightmove.co.uk/property-to-rent/find.html*',
    '*://www.rightmove.co.uk/property-for-sale/search.html*',
  ]);

  await Promise.all(searchTabs.map(tab => browser.tabs.reload(tab.id)));
}

/**
 * @param {string[]} urls
 * @returns {Promise<browser.tabs.Tab[]>}
 */
async function queryMultipleUrls(urls) {
  const results = await Promise.all(urls.map(urlPattern => 
    browser.tabs.query({ url: urlPattern })
  ));

  return results.flat();
}

/**
 * @param {string} id The ID of the property
 * @returns {Promise<void>}
 */
async function hidePropertyForAuthenticatedUser(id) {
  const body = JSON.stringify([
    {
      id,
      action: 'HIDE',
    },
  ]);

  const response = await fetch('https://my.rightmove.co.uk/property/status', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error('Failed to hide property');
  }
}

/**
 * 
 * @returns {Promise<browser.tabs.Tab>}
 */
async function getCurrentTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error('Could not find the current tab');
  }

  return tab;
}

/**
 * https://www.rightmove.co.uk/properties/134435768#/?channel=RES_LET
 *
 * @param {string} url The URL of the property
 * @returns {Promise<?string>} The ID of the property
 */
async function getPropertyId(url) {
  return url.match(/\/properties\/(\d+)/)?.[1];
}

browser.commands.onCommand.addListener(async function (command) {
  switch (command) {
    case 'hide-property':
      await hidePropertyCommand();
      break;
  }
});
