# Pyramid Solitaire

Implementation of the Pyramid version of Solitaire.

The objective of the game is to eliminate all cardcs from the pyramid. Cards may be eliminated by removing both cards in a pair which sum to 13.

Aces have a value of 1, a Jack is 11, a Queen is 12, and a king is 13 (meaning it can be removed on its own). To pair cards, click on a two cards and they will be removed to the *waste* pile. Draw a card by clicking on the *draw* pile. If the draw pile is empty, the stock pile will be turned face-up (and **not** re-shuffled).

## Layout

- *Pyramid* - this is the main game structure. Win the game by eliminating all cards from the pyramid. This is done by pairing cards which sum to 13 (aces have a value of 1, jack's 11, queen's 12, king's 13).
- *Stock* - pile in the bottom-left. Click on this pile to draw a new card onto the waste pile. If empty, click here to restock from the waste pile.
- *Waste* - to the right of the stock pile. The topmost card here may be used in pairings.
- *Foundation* - pile in the bottom-right, this is where paired cards are discarded to.
- *Ideal* - this is an optional pile. When enabled, the ideal card to complete the selected card's pairing is here. Click to remove the selected card to the foundation.

## Controls

- *New Game* - creates a new game.
- *Show Pairing* - enables the ideal pile, as described above.
- *Hide Cards* - by default, all pyramid cards are front-up. When enabled, only cards which are uncovered and their immediate neighbors are front-up, the rest are front-down.

Click on a card to select it. This is inidicated by a glowing white border. Click on another card to attempt to create a pairing. If the pair is valid, both cards will be discarded into the Foundation pile. Else, the second card will be selected and the first card de-selected. Note, that as a King has a value of 13 it is discarded immediately. The Ideal pile is special as it will not be selected, but will disappear with the initial card being discarded.

## Attribution
Game icon on main page created by Hilmy Abiyyu A. - Flaticon: https://www.flaticon.com/free-icons/playing-cards.
