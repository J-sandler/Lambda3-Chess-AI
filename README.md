# Lambda3-Chess-AI
Alpha-beta/Neural net chess bot.

## Why Lambda '3'?
Prominent Chess engines like Alpha Zero get their names
from the notion of 'Zero' human assistance. The idea that 
by means of machine learning alone, an AI can become dominant 
in any domain. 

While this is the goal it is not how Lambda3 works, as 
it uses 3 sources of pre-developed and hard coded human strategy:

1. **Piece sum value**:
  After reaching a leaf node in the Monte Carlo search, Lambda3 will be given
  the sum of all the pieces to aid in its evaluation. The piece values were 
  conceived by humans and hence Lmabda3's postional understanding in this instance
  was not dervied solely by itself.

2. **Legal Moves**:
  In a dire position, one will often have fewer moves, while the opposite is conversly true.
  Lambda3 is given the number of legal moves a player has to aid its evaluation. High move
  counts improve the board states evaluation, comparitevly discounting low legal move counts.
  Additionally, Since we have access to the legal moves, we tell lambda3 to improve its evaluation of states
  where the legal moves are mosly captures and checks, as this generally corresponds to stronger positions.
  
3. **Super Search**:
  Due to the reality of limited computing resources lambda3 cant afford to tree search to a depth of Infinity.
  To make up for the depth restricitons we are forecd to place on the search, we can break the depth limit in 
  cases where we think it is advantagous to do so. This is shown to be extemely helpful to the AI's success 
  when branches involving captures are searched, essentially it keeps calculating until the dust has settled.
 
  The ultimate goal is that Lambda will dictate its own super searches by means of its neural network...
  
## Using Lambda3

**To generate a move** in any position, click 'Generate AI Move' and wait a few moments. The AI will also display
its evaluation of the position left of the board.


If instead you would like to **input a move yourself**, submit your move in the input box in formal notation, 
i.e 'Nxe4', and click the checkmark.

To view more details such as number of positons searched, number of super searches, caches and estimated prune optimizations,
**check the console** after Lambda3 makes a move.


###**Sources**
Chess.js (Legal Moves/Rules Module): https://github.com/jhlywa/chess.js
Tensor.js (Machine Learning Library): https://www.tensorflow.org/js
