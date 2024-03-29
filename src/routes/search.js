import express from 'express';
const router = express.Router();

import Genius from 'genius-lyrics';
const Client = new Genius.Client();

import alibarray from 'alib-array';
import condenseWhitespace from 'condense-whitespace';

import EnglishFilter from 'bad-words';
import KoreanFilter from 'badwords-ko';
const englishFilter = new EnglishFilter();
const koreanFilter = new KoreanFilter();

router.get('/english', async (req, res) => {
  try {
    const searchResultsEnglish = await Client.songs.search(
      req.query.searchTerm + ' english'
    );

    for (let song of searchResultsEnglish) {
      // when searching for english lyrics, omit romanized lyrics
      if (!song.title.toLowerCase().includes('romanize')) {
        return res.send({
          title: song.title,
          artist: song.artist.name,
          imageSrc: song._raw.song_art_image_url,
          lyrics: englishFilter
            .clean(
              koreanFilter.clean(
                (await song.lyrics()).replaceAll('\n', ' !@#$%^&*() ') // convert to identifiable string
              )
            )
            .replaceAll(' !@#$%^&*() ', '\r\n'), // convert identifiable string to html-readable format
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(400).send();
  }
});

router.get('/multiple', async (req, res) => {
  try {
    const searchResultsKorean = await Client.songs.search(
      `${req.query.searchTerm} korean`
    );
    const searchResultsOriginal = await Client.songs.search(
      req.query.searchTerm
    );
    const allSearchResults = [searchResultsKorean, searchResultsOriginal];

    let count = 0;
    const songs = [];
    for (let searchResult of allSearchResults) {
      for (let song of searchResult) {
        if (count < 8) {
          if (
            !song.title.toLowerCase().includes('english translation') &&
            !song.title.toLowerCase().includes('english version')
          ) {
            const imageSrc = song._raw.song_art_image_url;
            const geniusDefaultImageUrl =
              'https://assets.genius.com/images/default_cover_image.png';
            if (!imageSrc.includes(geniusDefaultImageUrl)) {
              songs.push({
                title: condenseWhitespace(
                  song.title
                    .replace('(한국어 번역)', '')
                    .trimEnd()
                    .replace('(Korean Version)', '')
                ),
                artist: condenseWhitespace(
                  song.artist.name.replace('(한국어 번역)', '')
                ),
                imageSrc,
                lyrics: englishFilter
                  .clean(
                    koreanFilter.clean(
                      (await song.lyrics()).replaceAll('\n', ' !@#$%^&*() ') // convert to identifiable string
                    )
                  )
                  .replaceAll(' !@#$%^&*() ', '\r\n'), // convert identifiable string to html-readable format
              });
              count += 1;
            }
          }
        }
      }
    }

    const uniqueSongs = [];
    for (let song of songs) {
      if (!alibarray().contains(uniqueSongs, song)) {
        uniqueSongs.push(song);
      }
    }
    res.send(uniqueSongs);
  } catch (err) {
    console.log(err);
    res.status(400).send();
  }
});

export default router;
