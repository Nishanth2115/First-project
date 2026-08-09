/* =============================================================
   Backend Song Dataset — 70 Curated 100% Unique Kannada Songs
============================================================= */

const SONG_DATA = {

  /* ── HAPPY ──────────────────────────────────────────── */
  happy: [
    { title: "Feel the Power",             artist: "Puneeth Rajkumar, Shashaa Tirupati", movie: "Yuvarathnaa",           duration: 222, intensity: 8  },
    { title: "Chinnamma",                  artist: "K.S. Chithra, Rajesh Krishnan",       movie: "Maanikya",             duration: 255, intensity: 18 },
    { title: "Open Hairu",                  artist: "Nakul Abhyankar, Ramya Bhat",         movie: "Love Mocktail 2",       duration: 210, intensity: 28 },
    { title: "Dance With Appu",            artist: "Sanjith Hegde",                       movie: "James",                duration: 198, intensity: 38 },
    { title: "Chuttu Chuttu",             artist: "Ravindra Soragavi, Shamitha Malnad",  movie: "Rambo 2",              duration: 252, intensity: 48 },
    { title: "Neenade Naa",                artist: "Armaan Malik",                        movie: "Kirik Party",           duration: 215, intensity: 58 },
    { title: "Singara Siriye",            artist: "Vijay Prakash, Ananya Bhat",          movie: "Kantara",              duration: 280, intensity: 68 },
    { title: "Hands Up",                   artist: "Vijay Prakash, Shashank Shethagiri",  movie: "Avane Srimannarayana", duration: 228, intensity: 78 },
    { title: "Gillako Siva",              artist: "Mangli, Charan Raj",                  movie: "Vedha",                duration: 232, intensity: 88 },
    { title: "Pushpa Pushpa",             artist: "Nakash Aziz",                         movie: "Pushpa 2 Kannada",     duration: 255, intensity: 97 },
  ],

  /* ── SAD ────────────────────────────────────────────── */
  sad: [
    { title: "Kaagada Doniyalli",          artist: "Vasuki Vaibhav",                      movie: "Kirik Party",           duration: 270, intensity: 8  },
    { title: "Usire Usire",                artist: "Rajesh Krishnan",                     movie: "Huchcha",              duration: 320, intensity: 18 },
    { title: "Usiraagidhe",                artist: "Nakul Abhyankar",                     movie: "Love Mocktail 2",       duration: 250, intensity: 28 },
    { title: "Sapta Sagaradaache Ello",    artist: "Kapil Kapilan",                       movie: "Sapta Sagaradaache Ello Side A", duration: 285, intensity: 38 },
    { title: "Ninthu Nodalilla",           artist: "Mohan Krishna",                       movie: "KGF Chapter 2",         duration: 200, intensity: 48 },
    { title: "Innu Yaaka",                 artist: "B. Ajaneesh Loknath, Guduru Raju",    movie: "Vikrant Rona",         duration: 235, intensity: 58 },
    { title: "Janumagale Kaayuve",        artist: "Armaan Malik",                        movie: "Monsoon Raaga",         duration: 245, intensity: 68 },
    { title: "Soul of Dia (Sad)",          artist: "Sanjith Hegde",                       movie: "Dia",                  duration: 230, intensity: 78 },
    { title: "Ondu Munjane",               artist: "Shreya Ghoshal, Sonu Nigam",          movie: "Yajamana",             duration: 275, intensity: 88 },
    { title: "Bisilu Kudure",              artist: "Vijay Prakash",                       movie: "Googly",               duration: 260, intensity: 97 },
  ],

  /* ── CALM ───────────────────────────────────────────── */
  calm: [
    { title: "Nenapina Hakki",             artist: "Pradeep Kumar",                       movie: "777 Charlie",          duration: 240, intensity: 6  },
    { title: "Ninna Gungalli",             artist: "Vijay Prakash",                       movie: "Love Mocktail",        duration: 270, intensity: 16 },
    { title: "Minchagi Neenu",             artist: "Sonu Nigam",                          movie: "Gaalipata",            duration: 280, intensity: 26 },
    { title: "Dwapara",                    artist: "Jaskaran Singh",                      movie: "Krishnam Pranaya Sakhi", duration: 225, intensity: 36 },
    { title: "Kannu Hodiyaka",             artist: "Shreya Ghoshal",                      movie: "Pogaru",               duration: 250, intensity: 46 },
    { title: "Kaniveya Thazvaradali",      artist: "Charan Raj",                          movie: "Sapta Sagaradaache Ello Side B", duration: 260, intensity: 56 },
    { title: "Anisuthide Yaako Indu",      artist: "Sonu Nigam",                          movie: "Mungaru Male",         duration: 270, intensity: 66 },
    { title: "Koti Kanasugala",            artist: "Karthik, Vijay Prakash",              movie: "Baanadariyalli",       duration: 245, intensity: 76 },
    { title: "Sanihake Bandha",            artist: "Sanjith Hegde",                       movie: "Ninna Sanihake",       duration: 230, intensity: 86 },
    { title: "Mellanamellane",             artist: "Nakul Abhyankar",                     movie: "Love Mocktail 2",       duration: 220, intensity: 95 },
  ],

  /* ── ROMANTIC ───────────────────────────────────────── */
  romantic: [
    { title: "Shringarada Hunge Mara",     artist: "Vijay Prakash",                       movie: "Panchatantra",         duration: 260, intensity: 8  },
    { title: "Maathanaadi Maathanaadi",    artist: "Armaan Malik",                        movie: "I Love You",           duration: 255, intensity: 18 },
    { title: "Hrudayake Hedarike",         artist: "Sanjith Hegde",                       movie: "Tayige Takka Maga",    duration: 250, intensity: 28 },
    { title: "Ondu Malebillu",             artist: "Armaan Malik, Shreya Ghoshal",        movie: "Chakravarthy",         duration: 275, intensity: 38 },
    { title: "Mehabooba",                  artist: "Ananya Bhat",                         movie: "KGF Chapter 2",         duration: 220, intensity: 48 },
    { title: "Tabbahi",                    artist: "Yash",                                movie: "Toxic",                duration: 230, intensity: 58 },
    { title: "Romanchana",                 artist: "Nakul Abhyankar",                     movie: "Love Mocktail 2",       duration: 245, intensity: 68 },
    { title: "Love Rachu Title Song",      artist: "Vijay Prakash",                       movie: "Love Rachu",           duration: 252, intensity: 78 },
    { title: "Love You Chinna",            artist: "Shruti VS",                           movie: "Love Mocktail",        duration: 225, intensity: 88 },
    { title: "Neene Modalu",               artist: "Shreya Ghoshal",                      movie: "Kiss",                 duration: 250, intensity: 97 },
  ],

  /* ── ENERGETIC ──────────────────────────────────────── */
  energetic: [
    { title: "Odi Hombatha",               artist: "Vijay Prakash, Sonu Nigam",           movie: "Mugulu Nage",          duration: 245, intensity: 8  },
    { title: "Karabu",                     artist: "Chandan Shetty",                      movie: "Pogaru",               duration: 225, intensity: 18 },
    { title: "Power Of Youth",             artist: "Nakash Aziz",                         movie: "Yuvarathnaa",          duration: 230, intensity: 28 },
    { title: "Ra Ra Rakkamma",             artist: "Nakash Aziz, Sunidhi Chauhan",        movie: "Vikrant Rona",         duration: 225, intensity: 38 },
    { title: "Sulthana",                   artist: "Mohan Krishna, Sachin Basrur",        movie: "KGF Chapter 2",         duration: 220, intensity: 48 },
    { title: "Badava Rascal Title Track",  artist: "Vasuki Vaibhav",                      movie: "Badava Rascal",        duration: 210, intensity: 58 },
    { title: "Salaam Rocky Bhai",          artist: "Vijay Prakash, Santhosh Venky",       movie: "KGF Chapter 1",         duration: 245, intensity: 68 },
    { title: "Tagaru Banthu Tagaru",       artist: "Anthony Daasan",                      movie: "Tagaru",               duration: 220, intensity: 78 },
    { title: "Bheema Title Track",         artist: "Charan Raj, MC Bijju",                movie: "Bheema",               duration: 215, intensity: 88 },
    { title: "Martin Title Track",         artist: "Mani Sharma",                         movie: "Martin",               duration: 230, intensity: 97 },
  ],

  /* ── ANGRY ──────────────────────────────────────────── */
  angry: [
    { title: "Monster Song",               artist: "Adithi Sagar, Ravi Basrur",           movie: "KGF Chapter 2",         duration: 195, intensity: 10 },
    { title: "Ugramm Veeram",              artist: "Ravi Basrur",                         movie: "Ugramm",               duration: 260, intensity: 20 },
    { title: "Kaatera Mass Anthem",        artist: "V. Harikrishna",                      movie: "Kaatera",              duration: 230, intensity: 30 },
    { title: "Demon in Me",                artist: "Arjun Janya, Aishwarya Rangarajan",   movie: "Ghost",                duration: 205, intensity: 42 },
    { title: "Garuda Gamana Theme",        artist: "Midhun Mukundan",                     movie: "Garuda Gamana Vrishabha Vahana", duration: 220, intensity: 54 },
    { title: "Kabzaa Title Track",         artist: "Ravi Basrur",                         movie: "Kabzaa",               duration: 210, intensity: 65 },
    { title: "Mufti Mass Theme",           artist: "Ravi Basrur",                         movie: "Mufti",                duration: 225, intensity: 75 },
    { title: "Chowka Climax Theme",        artist: "V. Harikrishna",                      movie: "Chowka",               duration: 220, intensity: 84 },
    { title: "Bad Manners Action Theme",   artist: "Charan Raj",                          movie: "Bad Manners",          duration: 200, intensity: 92 },
    { title: "Roberrt Mass Theme",         artist: "Arjun Janya",                         movie: "Roberrt",              duration: 210, intensity: 99 },
  ],

  /* ── SLEEPY ─────────────────────────────────────────── */
  sleepy: [
    { title: "Laali Laali",                artist: "Ananya Bhat",                         movie: "KGF Chapter 1",         duration: 210, intensity: 6  },
    { title: "Jo Lali",                    artist: "Vijay Prakash",                       movie: "Yuvarathnaa",          duration: 240, intensity: 16 },
    { title: "Yadava Nee Baa",             artist: "Sooraj Santhosh",                     movie: "Kantara Devotional",   duration: 255, intensity: 26 },
    { title: "777 Charlie Lullaby",        artist: "Nobin Paul",                          movie: "777 Charlie",          duration: 225, intensity: 36 },
    { title: "Shuruaagidhe",               artist: "Sid Sriram",                          movie: "Love Mocktail 2",       duration: 255, intensity: 46 },
    { title: "Ee Kuralu",                  artist: "K.S. Chithra",                        movie: "Sapta Sagaradaache Ello Side B", duration: 250, intensity: 56 },
    { title: "Nigooda",                    artist: "Sanjith Hegde",                       movie: "Kavaludaari",          duration: 245, intensity: 66 },
    { title: "Taayi Song",                 artist: "Sonu Nigam",                          movie: "James",                duration: 255, intensity: 76 },
    { title: "Saluthillave",               artist: "Shreya Ghoshal, Vijay Prakash",       movie: "Kotigobba 2",          duration: 265, intensity: 86 },
    { title: "Jotheyali Jotheyali",       artist: "S.P. Balasubrahmanyam, S. Janaki",    movie: "Geetha",               duration: 270, intensity: 95 },
  ],

};

module.exports = SONG_DATA;
