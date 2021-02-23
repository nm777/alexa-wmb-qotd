const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

const url = 'https://branham.org/QuoteOfTheDay'
const fsBasePath = '/tmp'

async function RetrieveQotdWebPage() {
  return await axios.get(url)
    .then(response => cheerio.load(response.data))
    .catch(error => {
      console.log(error)
      throw error
    })
}

function DateCodeToDate(dateCode) {
  return new Date(
    Number.parseInt(dateCode.substring(0, 2)) + 1900,
    Number.parseInt(dateCode.substring(3, 5)) - 1,
    Number.parseInt(dateCode.substring(5, 7))
  )
}

async function BuildOutput() {
  const $ = await RetrieveQotdWebPage()

  const quoteDateCode = $('#title').text()
  const quoteSermon = $('#summary').text()
  const quoteText = $('#content').text()
  const quoteAudio = $('#audioplayer > audio > source').attr('src')

  const quoteDate = DateCodeToDate(quoteDateCode);
  const titleText = `Unofficial Voice of God Quote of the Day from ${quoteSermon}, preached ` +
    quoteDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const output = {
    uid: 'urn:uuid:b47fbeb7-f19b-4c8b-a9ad-38dbe84cf449',
    updateDate: (new Date).toISOString(),
    titleText,
    mainText: quoteText,
    streamUrl: quoteAudio,
    redirectionUrl: url,
  }

  return output
}

async function Output() {
  const now = new Date()

  const cachePath = `${fsBasePath}/.cache-${now.getFullYear()}` +
    ('0' + (now.getMonth() + 1)).substring(0,2) +
    ('0' + now.getDate()).substring(0,2) + 
    '-qotd'

  if (fs.existsSync(cachePath)) {
    const cached = fs.readFileSync(cachePath, { encoding: 'utf-8' })
    try {
      if (JSON.parse(cached) !== '') {
        return cached
      }
    } catch (e) { }
  }

  const output = JSON.stringify(await BuildOutput())

  fs.writeFileSync(cachePath, output)

  return output
}

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: await Output(),
  }
}
