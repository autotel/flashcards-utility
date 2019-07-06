import $ from "jQuery";
import api from "./ApiInterface.js";

api.getAll().then(function(cardsList){
  let $main=$('body');
  function chooseNextCardToPractice(){
    let chosen=cardsList[0];
    for(var card of cardsList){
      //score a practice priority based on learner confidence & date of last practice
      if(card.priority===undefined){
        console.error("card has no priority set",card);
      }else{
        if(card.priority>chosen.priority){
          chosen=card;
        }
      }
    }
    return chosen;
  }

  var displayer=new(function($main){
    let $el=$(`<div class="flashcard-container"></div>`);
    $el.appendTo($main);
    //ordered by confidence
    let userTestFuction=[
      function(card,answerCallback){
        //confidence 0: choose among two options
        console.log("gui start");
        let $question=$(`<span class="question confidence-0"> ${card.a}</span>`);
        let $input=$(`<input type="text"></input>`);
        let $evaluate=$(`<button>evaluate</button>`);
        let evaluator=new RegExp("\\b"+card.b_accept+"\\b","gi");
        $el.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:card.confidence-1);
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 1: choose among six options
        console.log("gui start");
        let $question=$(`<span class="question confidence-1"> ${card.a}</span>`);
        let $input=$(`<input type="text"></input>`);
        let $evaluate=$(`<button>evaluate</button>`);
        let evaluator=new RegExp("\\b"+card.b_accept+"\\b","gi");
        $el.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:card.confidence-1);
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 2: choose syllabes in order
        console.log("gui start");
        let $question=$(`<span class="question confidence-2"> ${card.a}</span>`);
        let $input=$(`<input type="text"></input>`);
        let $evaluate=$(`<button>evaluate</button>`);
        let evaluator=new RegExp("\\b"+card.b_accept+"\\b","gi");
        $el.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:card.confidence-1);
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 3: type, good text is highlighted
        console.log("gui start");
        let $question=$(`<span class="question confidence-3"> ${card.a}</span>`);
        let $input=$(`<input type="text"></input>`);
        let $evaluate=$(`<button>evaluate</button>`);
        let evaluator=new RegExp("\\b"+card.b_accept+"\\b","gi");
        $el.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:card.confidence-1);
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 4: i don't know yet.
        console.log("gui start");
        let $question=$(`<span class="question confidence-4"> ${card.a}</span>`);
        let $input=$(`<input type="text"></input>`);
        let $evaluate=$(`<button>evaluate</button>`);
        let evaluator=new RegExp("\\b"+card.b_accept+"\\b","gi");
        $el.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:card.confidence-1);//TODO count amt of correct characters in the right order.
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 5: type, no clues given
        console.log("gui start");
        let $question=$(`<span class="question confidence-5"> ${card.a}</span>`);
        let $input=$(`<input type="text"></input>`);
        let $evaluate=$(`<button>evaluate</button>`);
        let evaluator=new RegExp("\\b"+card.b_accept+"\\b","gi");
        $el.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0);//TODO count amt of correct characters in the right order.
          console.log($input.val().match(evaluator)?true:false);
        });
      },
    ];
    function displayQuestion(card){
      $el.html("");
      userTestFuction[Math.floor(card.confidence)](card,function(score){
        card.appendScore(score);
        console.log("user scored",score,card);
        nextQuestion();
      });
    };
    function nextQuestion(){
      displayQuestion(chooseNextCardToPractice());
    };
    nextQuestion();
  })($main);
}).catch(console.error);