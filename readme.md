project status: idea only. The idea is not even finished yet. Exploring.

## idea
there are plenty flashcards apps and the so, but I really hate that they come with built-in sets of flashcards. I learn better if I added the cards myself, specially because
* adding my own mnemonics
* selecting exactly what things I want to train, and not a predefined set that might have thousands of elements that I already have memorized

I want thusly to create this utility meant for users to host themselves, and fill themselves. Adding new contents has to be easy.

Each flashcard may have different type of "excercises" which are chosen in relation to a level of confidence that the user have learnt that card, and the level of difficulty of each excercise.
To express the ideas more easily, we will take the case of learning words in finnish, where english is the learning language, and finnish is a language to be learnt by flashcards.
* Selecting the correct option in finnish among other already existing wrong options in english.
  * Selecting the correct option, languages flipped.
  * number of options conveys a level of difficulty
* Selecting syllabes in correct order (like duolingo, only that since we focus on words, it splits the word itself)
  * wrong syllabes are added to increase difficulty.
* typing the correct option. Rules need to be added as what mistakes are sort of acceptable.
  * indicator for each letter whether it's currently acceptable or not, reduces difficulty
* typeing the correct option without any mistake (although options might be present). A regex could be part of the word's definition.

### card
fields:
* unique: a unique identification number
* a: name of side a
* a_accept: regex of what constitutes acceptable sidea
* b: name of side b
* b_accept: regex of what constitutes acceptable sideb
* mnem: mnemonic; a phrase or &gt;img &lt; for a picture (not html syntax, just "<img the_url>")
* lastpracticed: last time it was practiced
* history: string of last scores from 1 to 5, representing success. 
  * only a certain amount has to be taken, e.g. 10 last tries.
## architecture
mostly js based
* addresses
  * /index has the ui for excercising
  * /add form to add cards
  * /api responds with requests using GET, responds in json. For now it could authenticate using WP login?
    * ?action=get&n(n) gets &n cards
    * ?action=add& .... the values
    * ?action=testresult&unique=(unique)&score=(score) adds a score to the "history", lastPracticed is changed as consequence to current time.
* js code
  * ClientState object, state machine that manages what happens
    * State object,
      * construction procedure
      * start procedure
      * end procedure
      * change to (executes end, and then it sets the state to the next one)
  * cards ClientState
    * State init -> State displayCard (which consequently ajax requests the card)
    * State displaycard (user submit)
      * -> State submit() -> State displayCard()
      * -> State edit() -> State submitEdit()
    * test(card) functions that define 
      * displaying of the card
      * user interaction
      * how to evaluate upon submission
      * returns a promise, that completes when the user has finished responding.
### database
* use files, because it is a pain to transfer databases, since it's a single user thing, it shouldn't get too heavy.

* for writing it is desireable that each card has their own file, so if a writing error takes place, it is compartamentalized
* for reading it is desireable to have all the data in one file, so that it's only necessary to fopen & parse one file.
* every card is on one single text file
  * /api?action=backup makes a copy of the file. Only n last copies are kept.

* api/data/cards/(copynuber)cards.csv
* api/data/imgs/(card unique).(ext)
* 