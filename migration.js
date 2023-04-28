const contentful = require('contentful-management')
const axios = require('axios')
const fs = require('fs');
const TurndownService = require('turndown')
const { parseHtml } = require('contentful-html-rich-text-converter');

/**
 * Global variables that we're going use throughout this script
 * -----------------------------------------------------------------------------
 */

/**
 * Main WordPress endpoint.
 */
const wpEndpoint = ``

/**
 * API Endpoints that we'd like to receive data from
 * (e.g. /wp-json/wp/v2/${key})
 */
let wpData = {
  'posts': [],
};

/**
 * Contentful API requirements
 */
const ctfData = {
  accessToken: '',
  environment: '',
  spaceId: ''
}
Object.freeze(ctfData);

/**
 * Creation of Contentful Client
 */
const ctfClient = contentful.createClient({
  accessToken: ctfData.accessToken
})

/**
 * Internal: log output separator for terminal.
 */
const logSeparator = `-------`

/**
 * Object to store WordPress API data in
 */
let apiData = {}

/**
 * Object to store Contentful Data in.
 */
let contentfulData = []

/**
 * Markdown / Content conversion functions.
 */
const turndownService = new TurndownService({
  codeBlockStyle: 'fenced'
})

/**
 * Convert HTML codeblocks to Markdown codeblocks.
 */
turndownService.addRule('fencedCodeBlock', {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },
  replacement: function (content, node, options) {
    let className = node.firstChild.getAttribute('class') || ''
    let language = (className.match(/language-(\S+)/) || [null, ''])[1]

    return (
      '\n\n' + options.fence + language + '\n' +
      node.firstChild.textContent +
      '\n' + options.fence + '\n\n'
    )
  }
})

/**
 * Convert inline HTML images to inline markdown image format.
 */
turndownService.addRule('replaceWordPressImages', {
  filter: ['img'],
  replacement: function(content, node, options) {
    let assetUrl = contentfulData.assets.filter(asset => {
      let assertFileName = asset.split('/').pop()
      let nodeFileName = node.getAttribute('src').split('/').pop()

      if (assertFileName === nodeFileName) {
        return asset
      }
    })[0];

    return `![${node.getAttribute('alt')}](${assetUrl})`
  }
})

/**
 * Main Migration Script.
 * -----------------------------------------------------------------------------
 */

async function migrateContent() {
  let promises = [];

  console.log(logSeparator)
  console.log(`Getting WordPress API data`)
  console.log(logSeparator)

  async function makeApiCall(offset = 0, responses = []) {
    const response = await fetchData(`${wpEndpoint}posts?per_page=90&offset=${offset}&_embed`);
    // console.log(response)
    if (response.data.length === 0) {
      console.log('Received empty array, stopping API calls.');
      return responses;
    }
    console.log(`Received data with offset ${offset}`);
    responses = [...responses, ...response.data];
    // console.log(responses)
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await makeApiCall(offset + 90, responses);
  }

  makeApiCall()
    .then(response =>{
      apiData = [{
        success: true,
        endpoint: '',
        data: response
      }]
      // console.log(apiData)

      mapData();

    }).catch(error => {
      console.log(error)
    })

  // Loop over our content types and create API endpoint URLs
  // for (const [key, value] of Object.entries(wpData)) {
  //   let wpUrl = `${wpEndpoint}${key}?per_page=90&_embed`
  //   promises.push(wpUrl)
  // }

  // // console.log(promises)
  // getAllData(promises)
  //   .then(response =>{
  //     // console.log(response)
  //     apiData = response;

  //     mapData();

  //   }).catch(error => {
  //     console.log(error)
  //   })
}

function getAllData(URLs){
  return Promise.all(URLs.map(fetchData));
}

function fetchData(URL) {
  return axios
    .get(URL)
    .then(function(response) {
      return {
        success: true,
        endpoint: '',
        data: response.data
      };
    })
    .catch(function(error) {
      return { success: false };
    });
}

/**
 * Get our entire API response and filter it down to only show content that we want to include
 */
function mapData() {
  // Get WP posts from API object

  // Loop over our conjoined data structure and append data types to each child.
  for (const [index, [key, value]] of Object.entries(Object.entries(wpData))) {
    // console.log(index)
    // console.log(apiData[index])
    apiData[index].endpoint = key
  }

  console.log(`Reducing API data to only include fields we want`)
  let apiPosts = getApiDataType('posts')[0];
  // Loop over posts - note: we probably /should/ be using .map() here.
  for (let [key, postData] of Object.entries(apiPosts.data)) {
    console.log(`Parsing ${postData.slug}`)
    /**
     * Create base object with only limited keys
     * (e.g. just 'slug', 'categories', 'title') etc.
     *
     * The idea here is that the key will be your Contentful field name
     * and the value be the WP post value. We will later match the keys
     * used here to their Contentful fields in the API.
     */

    const getAuthor = (author) => {
      switch (author) {
        case 3:
          return "183lJRcw6dF75lJX2bNgAe"
        case 6:
        case 1:
          return  "5I27RwkdS6CP6XjC2WpqLC"
        case 11:
          return "5fqUZsu3MM6WiDTn7d6EDu"
        case 9:
          return "7b3CL6NQ42SDSiU3CzSJRb"
        case 5:
          return "3oHaFoRyTUkPCEAdsqZfaJ"
        case 8:
          return "5JkK25E4sibcQVYK1FfDbg"
        case 19:
          return "387x12Q3htyayZgFICo05u"
        case 18:
          return "6oppQ7RJ2T5BpHtedsHGqw"
        case 20:
          return "18bAavq2WVilJIdZnzO1IP"
        case 4:
          return "3wmsBDS946ePClCbgSJCJw"
        case 13:
          return "2YGZCFuWg8NWkrgOu6F5DZ"
        case 2:
        case 7:
        case 22:
        default:
          return "6bcbiBjnMl8RTR3XtplFiN"
      }
    }

    const contentfulCategories = [
      {
        "slug": "college-admissions",
        "id": "5gnU0HnYwA4pW5quRpmOyz"
      },
      {
        "slug": "college-housing",
        "id": "1QOpqFKdlo7aMi8OwHKdwO"
      },
      {
        "slug": "community-college",
        "id": "5LQBov519YC42PIM50UoX7"
      },
      {
        "slug": "exams",
        "id": "2obd94clBGsisOcFvbxViL"
      },
      {
        "slug": "financial-aid",
        "id": "4SbNd7UdRi5mJAt4cw0YHp"
      },
      {
        "slug": "international-students",
        "id": "5k0Quixlp0gywwB7lxXlzJ"
      },
      {
        "slug": "saving-for-college",
        "id": "6whrITEUs7KjJGUkXLjBWU"
      },
      {
        "slug": "scholarships",
        "id": "Sq3qcP98UzUo2eHdHSk4R"
      },
      {
        "slug": "tax-credit",
        "id": "341kLaA5F0y74dcSe8cSE8"
      },
      {
        "slug": "work-study",
        "id": "4FdG3cEXy417OAeAK2Jy99"
      },
      {
        "slug": "to-be-sorted",
        "id": "6yTIHv0HSb0EecUXiv160n"
      },
      {
        "slug": "all-loans",
        "id": "undefined"
      },
      {
        "slug": "medical-school-loans",
        "id": "3NbdptxC0palyU2YTuNIfz"
      },
      {
        "slug": "parent-loan",
        "id": "46tUjVoZ3eVp1IYifrE7er"
      },
      {
        "slug": "personal-loans",
        "id": "7fdjYba9UllB92A1eA6ERW"
      },
      {
        "slug": "private-student-loans",
        "id": "5GPBIFuCtvlri70OCn1gH2"
      },
      {
        "slug": "student-loan-reviews",
        "id": "5FQGunVoXRZqW8scvQUntU"
      },
      {
        "slug": "student-loans",
        "id": "5xNqX7ueBzxQqMe0TDh4Si"
      },
      {
        "slug": "federal-student-loan-repayment",
        "id": "3YUdssNZa4IrlVgm4uqPnw"
      },
      {
        "slug": "refinance-student-loans",
        "id": "4koJBNVgTIKCv59SE4kWfV"
      },
      {
        "slug": "student-loan-consolidation",
        "id": "33orQOTyncgCovZlaf7p2E"
      },
      {
        "slug": "student-loan-forgiveness",
        "id": "1rbI9zmqBkIjZSyJLBxwd9"
      },
      {
        "slug": "student-loan-repayment-options",
        "id": "01B2WLoktC2p1i8mVtejhJ"
      },
      {
        "slug": "student-loan-tax-deduction",
        "id": "2NDahQF32Negr3lAMVON3N"
      },
      {
        "slug": "blog",
        "id": "1oqvjztSa2LG0cKleHNFoc"
      },
      {
        "slug": "covid-19",
        "id": "1Vt8h0kDpEkEptX0nfdnn2"
      },
      {
        "slug": "politics",
        "id": "7lCnsrs1AY6XWAp7ZRzFgK"
      },
      {
        "slug": "research",
        "id": "sc4NUQGz0XvXVTmHrqha0"
      }
    ]

    const wpCategories = [
      {
        "id": 4616,
        "slug": "loans"
      },
      {
        "id": 83,
        "slug": "blog"
      },
      {
        "id": 63,
        "slug": "borrow"
      },
      {
        "id": 3897,
        "slug": "college-admissions"
      },
      {
        "id": 4617,
        "slug": "college-housing"
      },
      {
        "id": 4852,
        "slug": "community-college"
      },
      {
        "id": 4084,
        "slug": "compare"
      },
      {
        "id": 3059,
        "slug": "covid-19"
      },
      {
        "id": 4615,
        "slug": "exams"
      },
      {
        "id": 1415,
        "slug": "federal-student-loan-repayment"
      },
      {
        "id": 37,
        "slug": "financial-aid"
      },
      {
        "id": 3847,
        "slug": "international-students"
      },
      {
        "id": 4743,
        "slug": "investing"
      },
      {
        "id": 4672,
        "slug": "life-after-college"
      },
      {
        "id": 4618,
        "slug": "medical-school-loans"
      },
      {
        "id": 5361,
        "slug": "minimum-wage"
      },
      {
        "id": 328,
        "slug": "news"
      },
      {
        "id": 67,
        "slug": "parent-loan"
      },
      {
        "id": 863,
        "slug": "personal-loans"
      },
      {
        "id": 62,
        "slug": "plan"
      },
      {
        "id": 85,
        "slug": "politics"
      },
      {
        "id": 70,
        "slug": "private-student-loans"
      },
      {
        "id": 4085,
        "slug": "compare-loans"
      },
      {
        "id": 73,
        "slug": "refinance-student-loans"
      },
      {
        "id": 4675,
        "slug": "compare-refinance-student-loans"
      },
      {
        "id": 64,
        "slug": "repay"
      },
      {
        "id": 4088,
        "slug": "research"
      },
      {
        "id": 65,
        "slug": "resources"
      },
      {
        "id": 38,
        "slug": "saving-for-college"
      },
      {
        "id": 39,
        "slug": "scholarships"
      },
      {
        "id": 74,
        "slug": "student-credit-cards"
      },
      {
        "id": 4086,
        "slug": "compare-creditcards"
      },
      {
        "id": 4619,
        "slug": "student-loan-consolidation"
      },
      {
        "id": 3833,
        "slug": "student-loan-forgiveness"
      },
      {
        "id": 81,
        "slug": "student-loan-repayment-options"
      },
      {
        "id": 75,
        "slug": "student-loan-reviews"
      },
      {
        "id": 4621,
        "slug": "student-loan-tax-deduction"
      },
      {
        "id": 66,
        "slug": "student-loans"
      },
      {
        "id": 3891,
        "slug": "tax-credit"
      },
      {
        "id": 1,
        "slug": "uncategorized"
      },
      {
        "id": 2499,
        "slug": "work-study"
      }
    ]

    const mapCategoryToContentfulID = (wpCatID) => {
      const wpCatSlug = wpCategories.find(wpCat => wpCat.id === wpCatID)?.slug;
      return contentfulCategories.find(contentfulCategory => contentfulCategory.slug === wpCatSlug)?.id;
    }

    const mapCategoriesToContentfulEntityLink = (wpCatIDs) => {
      if (wpCatIDs && wpCatIDs.length > 0) {
        return wpCatIDs.map((wpCatID) => {
          return {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: mapCategoryToContentfulID(wpCatID),
            }
          };
        })
      } else {
        return [{
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: "6wFUfEfoZWICKo0YRQa7Ck",
          }
        }];
      }
    }

    const content = parseHtml(postData.content.rendered);

    let fieldData = {
      id: postData.id,
      slug: postData.slug,
      title: postData.title.rendered,
      summary: postData.excerpt.rendered.replace(/(<([^>]+)>)/gi, "").replace(' [&hellip;]', '...').replace('[&hellip;]', '...'),
      author: postData.author,
      originalPublishedDate: postData.date_gmt + '+00:00',
      // content: content,
      featuredImage: postData["_embedded"]["wp:featuredmedia"] ? postData["_embedded"]["wp:featuredmedia"][0]["source_url"] : undefined,
      author: {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: getAuthor(postData.author),
        }
      },
      subcategories: mapCategoriesToContentfulEntityLink(postData.categories)
    }

    // console.log(postData["_embedded"]["wp:featuredmedia"] ? postData["_embedded"]["wp:featuredmedia"][0]["source_url"] : undefined)

    wpData.posts.push(fieldData)
  }

  console.log(`...Done!`)
  console.log(logSeparator)

  writeDataToFile(wpData, 'wpPosts');
  createForContentful();
}

function getPostBodyImages(postData) {
  // console.log(`- Getting content images`)
  let imageRegex = /<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g
  let bodyImages = []

  if (postData.featured_media > 0) {
    let mediaData = getApiDataType(`media`)[0];

    let mediaObj = mediaData.data.filter(obj => {
      if (obj.id === postData.featured_media) {
        return obj
      }
    })[0];

    bodyImages.push({
      link: mediaObj.source_url,
      description: mediaObj.alt_text,
      title:  mediaObj.alt_text,
      mediaId: mediaObj.id,
      postId: mediaObj.post,
      featured: true
    })
  }

  while (foundImage = imageRegex.exec(postData.content.rendered)) {
    let alt = postData.id

    if (foundImage[0].includes('alt="')) {
      alt = foundImage[0].split('alt="')[1].split('"')[0] || ''
    }

    bodyImages.push({
      link: foundImage[1],
      description: alt,
      title: alt,
      postId: postData.id,
      featured: false
    })
  }
  return bodyImages
}

function getPostLabels(postItems, labelType) {
  let labels = []
  let apiTag = getApiDataType(labelType)[0];

  for (const labelId of postItems) {
    let labelName = apiTag.data.filter(obj => {
      if (obj.id === labelId) {
        return obj.name
      }
    });

    labels.push(labelName[0].name)
  }

  return labels
}

/**
 * Helper function to get a specific data tree for a type of resource.
 * @param {String} resourceName - specific type of WP endpoint (e.g. posts, media)
 */
function getApiDataType(resourceName) {
  let apiType = apiData.filter(obj => {
    if (obj.endpoint === resourceName) {
      return obj
    }
  });
  return apiType
}

/**
 * Write all exported WP data to its own JSON file.
 * @param {Object} dataTree - JSON body of WordPress data
 * @param {*} dataType - type of WordPress API endpoint.
 */
function writeDataToFile(dataTree, dataType) {
  console.log(`Writing data to a file`)

  fs.writeFile(`./${dataType}.json`, JSON.stringify(dataTree, null, 2), (err) => {
    if (err) {
      console.error(err);
      return;
    };
    console.log(`...Done!`)
    console.log(logSeparator)
  });
}

/**
 * Create Contentful Client.
 */
function createForContentful() {
  ctfClient.getSpace(ctfData.spaceId)
  .then((space) => space.getEnvironment(ctfData.environment))
  .then((environment) => {
    buildContentfulAssets(environment);
  })
  .catch((error) => {
    console.log(error)
    return error
  })
}

/**
 * Build data trees for Contentful assets.
 * @param {String} environment - name of Contentful environment.
 */
function buildContentfulAssets(environment) {
  let assetPromises = []

  console.log('Building Contentful Asset Objects')

  // For every image in every post, create a new asset.
  for (let [index, wpPost] of wpData.posts.entries()) {
    if (wpPost.featuredImage) {
      let assetObj = {
        title: {
          'en-US': wpPost.title
        },
        description: {
          'en-US': wpPost.title
        },
        file: {
          'en-US': {
            contentType: 'image/jpeg',
            fileName: wpPost.featuredImage.split('/').pop(),
            upload: encodeURI(wpPost.featuredImage)
          }
        }
      }

      assetPromises.push(assetObj);
    }
  }

  let assets = []

  console.log(`Creating Contentful Assets...`)
  console.log(logSeparator)

  // getAndStoreAssets()

  createContentfulAssets(environment, assetPromises, assets)
    .then((result) => {
      console.log(`...Done!`)
      console.log(logSeparator)

      getAndStoreAssets(environment, assets)
    })
}

/**
 * Fetch all published assets from Contentful and store in a variable.
 * @param {String} environment - name of Contentful Environment.
 * @param {Array} assets - Array to store assets in.
 */
function getAndStoreAssets(environment, assets) {
  console.log(`Storing asset URLs in a global array to use later`)
    // Not supported with JS? Easier to get all assets and support
    axios.get(`https://api.contentful.com/spaces/${ctfData.spaceId}/environments/${ctfData.environment}/public/assets`,
    {
      headers: {
        'Authorization':`Bearer ${ctfData.accessToken}`
      }
    })
    .then((result) => {
      // console.log(result)
      contentfulData.assets = []
      for (const item of result.data.items) {
        contentfulData.assets.push(item.fields.file['en-US'].url)
      }

      createContentfulPosts(environment, assets)

    }).catch((err) => {
      console.log(err)
      return err
    });
    console.log(`...Done!`)
    console.log(logSeparator)
}

/**
 * Create a Promise to publish all assets.
 * Note that, Timeout might not be needed here, but Contentful
 * rate limits were being hit.
 * @param {String} environment - Contentful Environment
 * @param {Array} promises - Contentful Asset data trees
 * @param {Array} assets - array to store Assets in
 */
function createContentfulAssets(environment, promises, assets) {
  return Promise.all(
    promises.map((asset, index) => new Promise(async resolve => {

      let newAsset
      setTimeout(() => {
        try {
          newAsset = environment.createAsset({
            fields: asset
          })
          .then((asset) => asset.processForAllLocales())
          .then((asset) => asset.publish())
          .then((asset) => {
            console.log(`Published Asset: ${asset.fields.file['en-US'].fileName}`);
            assets.push({
              assetId: asset.sys.id,
              fileName: asset.fields.file['en-US'].fileName
            })
          })
        } catch (error) {
          throw(Error(error))
        }

        resolve(newAsset)
      }, 1000 + (5000 * index));
    }))
  );
}

/**
 * For each WordPress post, build the data for a Contentful counterpart.
 * @param {String} environment - Name of Contentful Environment.
 * @param {Array} assets - array to store Assets in
 */
function createContentfulPosts(environment, assets) {
  console.log(`Creating Contentful Posts...`)
  console.log(logSeparator)

  // let postFields = {}
  /**
   * Dynamically build our Contentful data object
   * using the keys we built whilst reducing the WP Post data.alias
   *
   * Results:
   *  postTitle: {
   *    'en-US': wpPost.postTitle
   *   },
   *  slug: {
   *    'en-US': wpPost.slug
   *  },
   */
  let promises = []

  for (const [index, post] of wpData.posts.entries()) {
    let postFields = {}

    for (let [postKey, postValue] of Object.entries(post)) {
      // console.log(`postKey: ${postValue}`)
      // if (postKey === 'content') {
      //   postValue = turndownService.turndown(postValue)
      // }

      /**
       * Remove values/flags/checks used for this script that
       * Contentful doesn't need.
       */
      let keysToSkip = [
        'id',
        'type',
        'contentImages'
      ]

      if (!keysToSkip.includes(postKey)) {
        postFields[postKey] = {
          'en-US': postValue
        }
      }

      if (postKey === 'featuredImage' && postValue > 0) {
        let assetObj = assets.filter(asset => {
          if (asset.fileName === post.contentImages[0].link.split('/').pop()) {
            return asset
          }
        })[0];

        console.log(postKey)

        postFields.featuredImage = {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: assetObj.assetId
            }
          }
        }
      }

      // No image and Contentful will fail if value is '0', so remove.
      if (postKey === 'featuredImage' && postValue === 0) {
        delete postFields.featuredImage
      }
    }
    promises.push(postFields)
    // break;
  }

  console.log(`Post objects created, attempting to create entries...`)
  // console.log(promises)
  createContentfulEntries(environment, promises)
    .then((result) => {
      console.log(logSeparator);
      console.log(`Done!`);
      console.log(logSeparator);
      console.log(`The migration has completed.`)
      console.log(logSeparator);
    });
}

/**
 * For each post data tree, publish a Contentful entry.
 * @param {String} environment - Name of Contentful Environment.
 * @param {Array} promises - data trees for Contentful posts.
 */
function createContentfulEntries(environment, promises) {
  return Promise.all(promises.map((post, index) => new Promise(async resolve => {

    let newPost

    console.log(`Attempting: ${post.slug['en-US']}`)
    // console.log(post.featuredImage['en-US'])

    setTimeout(() => {
      try {
        newPost = environment.createEntry('post', {
          fields: post
        })
        // .then((entry) => entry.publish())
        .then((entry) => {
          console.log(`Success: ${entry.fields.slug['en-US']}`)
        })
      } catch (error) {
        throw(Error(error))
      }

      resolve(newPost)
    }, 1000 + (5000 * index));
  })));
}

/**
 * Convert WordPress content to Contentful Rich Text
 * Ideally we'd be using Markdown here, but I like the RichText editor 🤡
 *
 * Note: Abandoned because it did not seem worth the effort.
 * Leaving this here in case anybody does decide to venture this way.
 *
 * @param {String} content - WordPress post content.
 */
function formatRichTextPost(content) {
  // TODO: split  at paragraphs, create a node for each.
  console.log(logSeparator)

  // turndownService.remove('code')
  let markdown = turndownService.turndown(content)

  // console.log(logSeparator)
  // console.log(markdown)

  // let imageLinks = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g
  // let imageRegex = /<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g

  // while (foundImage = imageLinks.exec(markdown)) {
    // console.log(foundImage[0])
    // let alt = foundImage[0].split('alt="')[1].split('"')[0]
  // }


  /**
   * https://www.contentful.com/developers/docs/concepts/rich-text/
   */

  /**
   *     "expected": [
          "blockquote",
          "embedded-asset-block",
          "embedded-entry-block",
          "heading-1",
          "heading-2",
          "heading-3",
          "heading-4",
          "heading-5",
          "heading-6",
          "hr",
          "ordered-list",
          "paragraph",
          "unordered-list"
        ]
   */

  // let contentor = {
  //   content: [
  //     {
  //       nodeType:"paragraph",
  //       data: {},
  //       content: [
  //         {
  //           value: content,
  //           nodeType:"text",
  //           marks: [],
  //           data: {}
  //         }
  //       ]
  //     },
  //     // {
  //     //   nodeType:"paragraph",
  //     //   data: {},
  //     //   content: [
  //     //     {
  //     //       value: "lorem hello world two",
  //     //       nodeType:"text",
  //     //       marks: [],
  //     //       data: {}
  //     //     }
  //     //   ]
  //     // },
  //   ],
  //   data: {},
  //   nodeType: 'document'
  // };

  return markdown
}

migrateContent();
