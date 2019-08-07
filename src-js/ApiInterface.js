import $ from "jQuery";
// import Papa from "papaparse";
const scoreHistoryLength=4;
const confidenceWeight=1;
const dateWeight=30/24/60; //30 days weighs same as 1 in confidence, 5 being that it's always answered correct
const confidenceIdeal=5;
let dateIdeal=Date.now();

function forceInt(n){
    let r=parseInt(n);
    return r?r:0;
}
const ApiInterface=function(){
    let Card=function(props){
        let self=this;
        for(var a in props){
            // console.log("th",a,props[a]);
            this[a]=props[a];
        }
        this.getBasicData=function(){
            var ret={}
            for(var a in props){
                ret[a]=props[a];
            }
            return ret;
        }
        function calculateConfidence(){
            if(!self.history){
                console.error("card doesn't have history field",self);
                self.history="";
            }
            //can be optimized, I am splitting quite too often by ";"
            let split=self.history.split(";");
            self.confidence=split.map(forceInt).reduce((a,b)=>a+b)/scoreHistoryLength;
            console.log(self.history,self.history.split(";"),self.confidence);
        }
        this.appendScore=function(score){
            score=Math.max(0,Math.floor(score));
            if(!self.history) self.history="";
            let phist=self.history.split(";");
            phist.unshift(score);
            phist=phist.splice(0,scoreHistoryLength);
            self.history=phist.join(";");
            self.lastpracticed=Date.now();
            calculateConfidence();
            updatePriority();
            console.log("score appended",self);
            updateInDatabase()
                .then(r=>console.log("saved local changes into database",r))
                .catch(r=>console.error("error saving local changes into database",r));
        }
        
        function updateInDatabase(){
            let ret = new Promise(function(resolve,reject){
                $.ajax(`./api`,{
                    dataType: "text",
                    data: {
                        action:"write",
                        //TODO: only write what has changed.
                        cards:[{
                            unique:self.unique,
                            a:self.a,
                            a_accept:self.a_accept,
                            b:self.b,
                            b_accept:self.b_accept,
                            mnem:self.mnem,
                            lastpracticed:self.lastpracticed,
                            history:self.history
                        }]
                    }
                }).then(function(contents){
                    let parsed=JSON.parse(contents);
                    if(parsed.error){
                        console.warn(parsed);
                        reject(new Error("Ajax succeeded but api failed: "+parsed.error));
                    }else{
                        resolve(parsed);
                    }
                }).catch(reject);
            });
            return ret;
        }
        function updatePriority(){
            if(self.confidence===undefined){ console.error(self,"has no confidence value");return;}
            dateIdeal=Date.now();
            self.priority=(confidenceIdeal-self.confidence)*confidenceWeight;
            self.priority+=(dateIdeal-self.lastpracticed)*dateWeight;
        }
        calculateConfidence();
        updatePriority();
    }
    this.writeCards=function(cardslist){
        console.log(cardslist);
        let ret = new Promise(function(resolve,reject){
            $.ajax(`./api`,{
                dataType: "json",
                data:{
                    action:"write",
                    cards:cardslist
                }
            }).then(function(contents){
                console.log(contents);
                if(contents.error){
                    console.warn("Ajax call succeeded, but API failed");
                    reject(new Error(contents));
                }else{
                    resolve(contents);
                }
            }).catch(reject);
        });
        return ret;
    }
    this.getAll=function(){
        let ret = new Promise(function(resolve,reject){
            $.ajax(`./api`,{
                dataType: "json",
                data:{
                    action:"get",
                }
            }).then(function(contents){
                console.log(contents);
                if(contents.error){
                    console.warn("Ajax call succeeded, but API failed");
                    reject(new Error(contents));
                }else{
                    let cardsList=[];
                    for(var obj of contents.cards){
                        cardsList.push(new Card(obj));
                    }
                    resolve(cardsList);
                }
            }).catch(reject);
        });
        return ret;

        /*
        let ret = new Promise(function(resolve,reject){
            //TODO: for now we're skipping the api and grabbing the whole table. 
            //It's more economic if there aren't that many entries.
            $.ajax("./api/data/cards/00.csv",{
                dataType: "text"
            }).then(function(contents){
                let parsed=Papa.parse(contents);
                // console.log(parsed);
                let cardsList=[];
                let fields=parsed.data[0].map(el=>el.trim());
                if(parsed.meta.aborted){
                    reject(parsed.errors);
                }else{
                    console.log(fields);
                    for(var elN in parsed.data){
                        if(elN==0) continue;//skip fields
                        let el=parsed.data[elN];
                        let obj={}
                        for(var fieldN in fields){
                            if(el[fieldN] && typeof el[fieldN].trim == "function")
                                obj[fields[fieldN]]=el[fieldN].trim().replace(/\"/g,"")
                        }
                        cardsList.push(new Card(obj));
                    }
                    console.log(cardsList);
                    resolve(cardsList);

                }
            }).catch(reject);
        });
        return ret;
        */
    }
};
var api=new ApiInterface();
export default api;