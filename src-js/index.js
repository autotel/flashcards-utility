import $ from "jQuery";
import api from "./ApiInterface.js";
function unsort(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};
api.getAll().then(function(cardsList){
  let $main=$('body');
  let currentCard=false;
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
  function cardWithUnique(unique){
    for(let card of cardsList){
      if(card.unique==unique) return card;
    }
  }
  var displayer=new(function($main){
    let $flashField=$(`<div class="flashcard-container"></div>`);
    let $addField=$(`<div class="editor-container"></div>`);
    $flashField.appendTo($main);
    $addField.appendTo($main);

    function getPhrase(card,side){
      if(!card[side+"_phrase"])card[side+"_phrase"]=card[side];
      let phrasecont;
      let rexp=new RegExp(card[side+"_accept"]?card[side+"_accept"]:card[side],"gi")
      console.log("regexp",rexp);
      if(card[side+"_phrase"].match(rexp)){
        phrasecont=card[side+"_phrase"].replace(rexp,`<span class="target-word">$&</span>`);
      }else{
        phrasecont=`${card[side+"_phrase"]} (${card[side]})`;

      }
      let ret=`<span class="example-phrase-${side}">${phrasecont}</span>`;
      // ret+="-"+card[side+"_accept"];
      return ret;
    }
    function getRandomSide(){
      return (["a","b"]).sort(a=>.5-Math.random());
    }
    //ordered by confidence
    let userTestFuction=[
      function(card,answerCallback){
        //confidence 0: choose among two options
        let side=getRandomSide();
        let el$=[];
        let $question=$(`<span class="question confidence-0">${getPhrase(card,side[0])}</span>`);
        let $input=$(`<input type="text" class="answer-type-text"></input>`);
        el$.push($question,$input);
        let options=[card[side[1]]];
        let otherCardN=Math.round(Math.random(cardsList.length-1));
        while(cardsList[otherCardN]==card){
          otherCardN=Math.round(Math.random(cardsList.length-1));
        }
        options.push(
          cardsList[otherCardN][side[1]]
        );
        options.sort(function() {
          return .5 - Math.random();
        });
        let $optionsField=$(`<span class="options-field"></span>`);
        el$.push($optionsField);
        for(let optionText of options){
          let $option=$(`<button class="option">${optionText}</button>`);
          $optionsField.append($option);
          $option.on("click",function(){
            $input[0].value=(optionText)
          });
        }
        let $evaluate=$(`<button class="primary-button">evaluate</button>`);
        el$.push($evaluate);
        let evaluator=new RegExp("\\b"+card[side[1]+"_accept"]+"\\b","gi");
        console.log(card[side[1]+"_accept"]);
        $flashField.append(el$);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0,$input.val());
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 1: choose among six options
        let side=getRandomSide();
        let el$=[];
        let $question=$(`<span class="question confidence-0"> ${getPhrase(card,side[0])}</span>`);
        let $input=$(`<input type="text" class="answer-type-text"></input>`);
        el$.push($question,$input);
        let options=[card[side[1]]];
        let $optionsField=$(`<span class="options-field"></span>`);
        el$.push($optionsField);
        for(let a=0; a<5; a++){
          let otherCardN=Math.round(Math.random(cardsList.length-1));
          while(cardsList[otherCardN]==card){
            otherCardN=Math.round(Math.random(cardsList.length-1));
          }
          options.push(
            cardsList[otherCardN][side[1]]
          );
        }

        //blatantly copied code:
        options=unsort(options);

        for(let optionText of options){
          let $option=$(`<button class="option">${optionText}</button>`);
          $optionsField.append($option);
          $option.on("click",function(){
            $input[0].value=(optionText)
          });
        }
        let $evaluate=$(`<button class="primary-button">evaluate</button>`);
        el$.push($evaluate);
        let evaluator=new RegExp("\\b"+card[side[1]+"_accept"]+"\\b","gi");
        console.log(card[side[1]+"_accept"]);
        $flashField.append(el$);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0,$input.val());
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 2: choose syllabes in order
        let side=getRandomSide();
        let el$=[];
        let $question=$(`<span class="question confidence-0">${getPhrase(card,side[0])}</span>`);
        let $input=$(`<input type="text" class="answer-type-text"></input>`);
        el$.push($question,$input);
        let $optionsField=$(`<span class="options-field"></span>`);
        el$.push($optionsField);
        function arbitrarySplit(string){
          if(string.length>30){
            return string.match(/([^\s]{2,100}| )|[^\s]+/g);
          }else if(string.length>10){
            return string.match(/([^\s]{2,3})|[^\s]+| /g);
          }else if(string.length>3){
            return string.match(/([^\s]{2})|[^\s]+| /g);
          }else{
            return string.match(/.| /g);
          }
        }
        let options=arbitrarySplit(card[side[1]]);
        for(let a=0; a<3; a++){
          let otherCardN=Math.round(Math.random(cardsList.length-1));
          while(cardsList[otherCardN]==card){
            otherCardN=Math.round(Math.random(cardsList.length-1));
          }
          options=options.concat(
            arbitrarySplit(cardsList[otherCardN].b)
          );
        }
        options=unsort(options);
        for(let optionText of options){
          let $option=$(`<button class="option">${optionText}</button>`);
          $optionsField.append($option);
          $option.on("click",function(){
            $input[0].value+=optionText
          });
        }
        let $evaluate=$(`<button class="primary-button">evaluate</button>`);
        el$.push($evaluate);
        let evaluator=new RegExp("\\b"+card[side[1]+"_accept"]+"\\b","gi");
        console.log(card[side[1]+"_accept"]);
        $flashField.append(el$);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0,$input.val());
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 3: type, good text is highlighted
        let side=getRandomSide();

        console.log("gui start");
        let $question=$(`<span class="question confidence-3">${getPhrase(card,side[0])}</span>`);
        let $input=$(`<input type="text" class="answer-type-text"></input>`);
        let $evaluate=$(`<button class="primary-button">evaluate</button>`);
        let evaluator=new RegExp("\\b"+card[side[1]+"_accept"]+"\\b","gi");
        console.log(card[side[1]+"_accept"]);
        $flashField.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0,$input.val());
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 4: i don't know yet.
        let side=getRandomSide();
        console.log("gui start");
        let $question=$(`<span class="question confidence-4">${getPhrase(card,"a")}</span>`);
        let $input=$(`<input type="text" class="answer-type-text"></input>`);
        let $evaluate=$(`<button class="primary-button">evaluate</button>`);
        let evaluator=new RegExp("\\b"+card[side[1]+"_accept"]+"\\b","gi");
        console.log(card[side[1]+"_accept"]);
        $flashField.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0,$input.val());//TODO count amt of correct characters in the right order.
          console.log($input.val().match(evaluator)?true:false);
        });
      },
      function(card,answerCallback){
        //confidence 5: type, no clues given
        let side=getRandomSide();
        console.log("gui start");
        let $question=$(`<span class="question confidence-5">${getPhrase(card,"a")}</span>`);
        let $input=$(`<input type="text" class="answer-type-text"></input>`);
        let $evaluate=$(`<button class="primary-button">evaluate</button>`);
        let evaluator=new RegExp("\\b"+card[side[1]+"_accept"]+"\\b","gi");
        console.log(card[side[1]+"_accept"]);
        $flashField.append([$question,$input,$evaluate]);
        $input.on("input type change",function(){
          console.log($input.val().match(evaluator));
        });
        $evaluate.on("click",function(){
          answerCallback($input.val().match(evaluator)?5:0,$input.val());//TODO count amt of correct characters in the right order.
          console.log($input.val().match(evaluator)?true:false);
        });
      },
    ];
    function displayQuestion(card){
      currentCard=card;
      $flashField.html("");
      userTestFuction[Math.floor(card.confidence)](card,function(score,response){
        $flashField.html(`
          <span class="result-feedback score-${score}">
            <span class="correct-a"> ${getPhrase(card,"a")}</span>
            <hr>
            <span class="correct-b"> ${getPhrase(card,"b")}</span>
            <hr>
            <span class="user-answer"> ${response}</span>
          </span>
        `);

        card.appendScore(score);
        console.log("user scored",score,card);
        let nextQuestionTimeout=setTimeout(nextQuestion,2000);
        //todo: this is ugly way to do it
        $('span.result-feedback').on('mousedown',()=>{
          clearTimeout(nextQuestionTimeout);
        });
        $('span.result-feedback').on('mouseup',()=>{
          nextQuestion();
        });
      });
    };

    
    function displayAddForm(){
      $addField.html("");
      var fields=[
        ["unique","<hr>unique"],
        ["a","english"],
        ["a_phrase","phrase"],
        ["a_accept","regexp"],
        ["b","finnish"],
        ["b_phrase","phrase"],
        ["b_accept","regexp"],
        ["mnem","mnemonic"],
      ];
      
      var newCard={};
      var el$=[];
      let $editButton=$(`<button class="edit">edit</button>`);
      let $newButton=$(`<button class="add">add</button>`);
      el$.push($editButton,$newButton);
      var fieldEls={};
      function FieldEl(field){
        fieldEls[field[0]]=this;
        let $question=$(`<span class="field-title field-${field[0]}-title">${field[1]}</span>`);
        let $input=$(`<input type="text" class="field-${field[0]}-input field-input"></input>`);
        this.val=function(str){
          $input.val(str);
          $input.trigger('change');
        }
        let inputCallback=false;
        this.onInput=function(cb){inputCallback=cb}
        $input.on("input type change",function(){
          newCard[field[0]]=$input.val();
          console.log(newCard);
          if(inputCallback)inputCallback($input);
        });
        el$.push($question,$input);
      }
      for(let field of fields){
        new FieldEl(field);
      }
      $editButton.on('click',function(){
        fieldEls['unique'].val(currentCard.unique);
        newCard['unique']=currentCard.unique;
      })
      $newButton.on('click',function(){
        fieldEls['unique'].val('new');
        newCard['unique']='new';
      })
      fieldEls['unique'].onInput($el=>{
        for(let fieldElName in fieldEls){
          if(fieldElName!='unique'){
            let cwu=cardWithUnique($el.val());
            if(cwu)
              fieldEls[fieldElName].val(cwu[fieldElName]);
          }
        }
      });
      fieldEls['a'].onInput($el=>{
        fieldEls['a_accept'].val($el.val());
      });
      fieldEls['b'].onInput($el=>{
        fieldEls['b_accept'].val($el.val());
      });
      let $submit=$(`<button class="primary-button">submit</button>`);
      el$.push($submit);
      $addField.append(el$);
      $submit.on("click",function(){
        api.writeCards([newCard]).then(function(resp){
          console.log(resp);
          $addField.html(JSON.stringify(resp));
          setTimeout(function(){
            displayAddForm();
          },2000);
        }).catch(console.error);
      });
    };
    function nextQuestion(){
      displayQuestion(chooseNextCardToPractice());
    };
    if(cardsList.length>2){
      nextQuestion();
    }else{
      $flashField.html("there needs to be at least two cards to start");
    }
    displayAddForm();
  })($main);
}).catch(console.error);