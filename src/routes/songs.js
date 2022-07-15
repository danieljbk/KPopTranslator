const express = require('express');
const router = express.Router();
const Song = require('../models/song');

router.get('/:koreanTitle', async (req, res) => {
  const koreanTitle = req.params.koreanTitle;
  try {
    const song = await Song.findOne({ koreanTitle });
    if (!song) {
      return res.status(400).send();
    }
    res.status(201).json({
      englishTitle: song.englishTitle,
      englishLyrics: song.englishLyrics,
    });
  } catch (e) {
    res.status(400).send();
  }
});

router.put('/:koreanTitle', async (req, res) => {
  const newSong = new Song({
    koreanTitle: req.params.koreanTitle,
    englishTitle: req.body.englishTitle,
    englishLyrics: req.body.englishLyrics,
  });
  try {
    Song.findOne({ koreanTitle: newSong.koreanTitle }, async (err, oldSong) => {
      console.log(err, oldSong);
      if (err || !oldSong) {
        // if the old song does not already exist in the database, save the new song
        try {
          const newlySavedSong = await newSong.save();
          res.status(201).send();
        } catch (err) {
          res.status(400).send();
        }
      } else {
        // if the old song already exists in the database, update its values
        try {
          oldSong.englishTitle = newSong.englishTitle;
          oldSong.englishLyrics = newSong.englishLyrics;

          const newlySavedSong = await oldSong.save();
          res.status(201).send();
        } catch (err) {
          res.status(400).send();
        }
      }
    });
  } catch (err) {
    res.status(400).send();
  }
});

module.exports = router;