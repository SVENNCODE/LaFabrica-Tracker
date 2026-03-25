/* Update - Code should be safe from SQL injections now all user inputs are passed using parameterized queries ($1) instead of
String concatenation, GROQ API key added
*/
const express = require('express');
const router = express.Router();
const pool = require('../database');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
 
// GET all players 
router.get('/', async (req, res) => {
  // This try block runs a SQL query to get all the players from the database and 
  // then orders them by last name and then first name and returns them in JSON in rows
  try {
    const result = await pool.query(
      `SELECT id, "firstName", "lastName", "dateofBirth", nationality, "position", "currentTeam" 
       FROM players 
       ORDER BY "lastName", "firstName"`
    );
    res.json(result.rows);
    //If internal error caught log error, set HTTP status code to 500 and returns error message to user
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET search players
router.get('/search', async (req, res) => {
  const { query } = req.query;
  //IMPORTANT if user hits search without typing anything ,return a empty list so database doesn't continue to search
  if (!query) {
    return res.json([]);
  }
 // Try to find player, "ILIKE" used for case-insensitivity, "%" wildcard used for partial matches of user query
  try {
    const result = await pool.query(
      `SELECT id, "firstName", "lastName", "position", "currentTeam", nationality
       FROM players 
       WHERE "firstName" ILIKE $1 
          OR "lastName" ILIKE $1 
          OR CONCAT("firstName", ' ', "lastName") ILIKE $1`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error searching players' });
  }
});
 
// Get players by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, "firstName", "lastName", "dateofBirth", nationality, "position", "currentTeam",
              "Height","preferredFoot", goals, assists, "minutesPlayed"
       FROM players 
       WHERE id = $1`,
      [id]
    );
 // If no player found, send back 404 error (not found) and stop here
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    //If player found send back the first (and only) player from results
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
 
// POST generate scout report for a player
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, "firstName", "lastName", "dateofBirth", nationality, "position", "currentTeam",
            "Height","preferredFoot", goals, assists, "minutesPlayed"
       FROM players 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    const player = result.rows[0];
 
  /* Calculate age from dateofBirth , gets current date and time and subtract from player date of birth and then divides by 
  number of miliseconds in a year */
    const age = player.dateofBirth
      ? Math.floor((new Date() - new Date(player.dateofBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : 'Age Unknown';
const prompt = `
You are a expert football scout. Based on the following player data, write a professional scout report 
that includes a performance analysis, development projection, and a comparison to a similar currently active professional player.
 
Player Data:
- Name: ${player.firstName} ${player.lastName}
- Age: ${age}
- Nationality: ${player.nationality}
- Position: ${player.position}
- Current Team: ${player.currentTeam}
- Height: ${player.Height ? `${player.Height}cm` : 'Not Yet added'}
- Preferred Foot: ${player.preferredFoot ?? 'Not Yet added'}
- Goals: ${player.goals ?? 'Not Yet added'}
- Assists: ${player.assists ?? 'Not Yet added'}
- Minutes Played: ${player.minutesPlayed ?? 'Not Yet added'}
 
Write the report in 3 clearly labeled sections:
1. Performance Analysis
2. Development Projection
3. Professional Comparison
 
Be specific, professional, and concise.
    `;
    // Uses llama 3.1 instant model for fast responses, max token set to 1000 so text output isn't too long (liable to change), 
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      //How message is communicated to AI model
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });
    // Stores the very first response, as sometimes AI model returns multipple responses, 
    /* Groq returns response object in this shape:
  {
    choices: [
      {
        message: {
          content: "AI generated text"
        }
      }
    ]
  }
*/
    const report = completion.choices[0].message.content;
    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});
 
module.exports = router;