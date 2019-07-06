<?php
$actionName=$_GET['action'];
$resp=Array();
$resp['debug']=$_GET;
//TODO: should be dynamic, and take the last alphabetically, since others are older copies of the db.
$database=false;

$dataAddr = './data/cards/00.csv';
function readDatabase(){
    global $dataAddr;
    global $database;
    $database=Array();
    $handle = fopen ($dataAddr,'r');
    $stillReading=fgetcsv ($handle);
    $stillReading=fgetcsv ($handle);//so we skip name row
    while($stillReading){
        $database[trim($stillReading[0])]=Array(
            unique=>trim($stillReading[0]),
            a=>trim($stillReading[1]),
            a_accept=>trim($stillReading[2]),
            b=>trim($stillReading[3]),
            b_accept=>trim($stillReading[4]),
            mnem=>trim($stillReading[5]),
            lastpracticed=>trim($stillReading[6]),
            history=>trim($stillReading[7]),
        );
        $stillReading=fgetcsv ($handle);
    }
    if(!$database){
        $resp['error']="database couldn't be opened";
        echo json_encode($resp);
        die;
    }
    fclose($handle);
}
$lastNewUnique=0;
function getNewUnique(){
    global $database;
    global $lastNewUnique;
    if(!$database){
        $resp['error']="database hasn't been opened";
        echo json_encode($resp);
        die;
    }
    $try=$lastNewUnique;
    while (true) {
        if(!array_key_exists($try,$database)){
            return $try;
        }
        $try++;
    }
}
function writeDatabase(){
    global $dataAddr;
    global $database;
    try{
        $handle = fopen ($dataAddr,'w+');
        fputcsv($handle,Array(
            "unique",
            "a",
            "a_accept",
            "b",
            "b_accept",
            "mnem",
            "lastpracticed",
            "history",
        ));
        foreach ($database as $key => $item) {
            fputcsv($handle,$item);
        }
        fclose($handle);
    }catch(Exception $e){
        if(!$database){
            $resp['error']="failed saving database. Caught exception: ".  $e->getMessage(). "\n";
            echo json_encode($resp);
            die;
        }
    }
}
function requireGetParameter($str){
    global $_GET;
    global $resp;
    if(!array_key_exists($str,$_GET)){
        $resp['error']="missing required parameter \"".$str."\"";
        echo json_encode($resp);
        die;
    }
}
switch ($actionName) {
    case 'get':{
        readDatabase();
        $resp['cards']=$database;
        break;
    }
    case 'update':{
        //TODO: should be a list, for consistency with "add" and for more economic saving of stuff.
        readDatabase();
        requireGetParameter('unique');
        $found=false;
        //if unique is "new", then create new. currently untested
        if($_GET['unique']=="new"){
            $key=getNewUnique();
            $_GET['unique']=$key;
            array_push($database,Array('unique'=>$key));
        }
        //change values in $database
        foreach ($database as $key => $item) {
            
            if($item['unique']==$_GET['unique']){
                $found=true;
                //TODO: refactor this crap
                if(array_key_exists('unique',$_GET))
                    $database[$key]['unique']=$_GET['unique'];
                if(array_key_exists('a',$_GET))
                    $database[$key]['a']=$_GET['a'];
                if(array_key_exists('a_accept',$_GET))
                    $database[$key]['a_accept']=$_GET['a_accept'];
                if(array_key_exists('b',$_GET))
                    $database[$key]['b']=$_GET['b'];
                if(array_key_exists('b_accept',$_GET))
                    $database[$key]['b_accept']=$_GET['b_accept'];
                if(array_key_exists('mnem',$_GET))
                    $database[$key]['mnem']=$_GET['mnem'];
                if(array_key_exists('lastpracticed',$_GET))
                    $database[$key]['lastpracticed']=$_GET['lastpracticed'];
                if(array_key_exists('history',$_GET))
                    $database[$key]['history']=$_GET['history'];

                break;
            }
        }
        if($found){
            //then write the $database
            writeDatabase();
        }else{
            $resp['error']="There was no element with that unique to write onto. ";
        }
        break;
    }
    case 'add':{
        readDatabase();
        requireGetParameter('cards');
        $news=false;
        //change values in $database
        foreach ($_GET['cards'] as $item) {
            $nitm=Array(
                'unique'=>getNewUnique(),
                'a'=>$item['a'],
                'a_accept'=>$item['a_accept'],
                'b'=>$item['b'],
                'b_accept'=>$item['b_accept'],
                'mnem'=>$item['mnem'],
                'lastpracticed'=>$item['lastpracticed'],
                'history'=>$item['history'],
            );
            array_push($database,$nitm);
            $news=true;
        }
        if($news){
            //then write the $database
            writeDatabase();
        }else{
            $resp['error']="No valid list of new elements was provided. ";
        }
        break;
    }
    case 'log':{
        readDatabase();
        echo ("<pre>");
        include($dataAddr);
        echo ("</pre>");
        echo ("<span>get new unique:</span>");
        echo ("<pre>");
        print_r(getNewUnique());
        echo ("</pre>");
        echo ("<pre>");
        print_r($database);
        echo ("</pre>");
        break;
    
    }
    default:
        $resp['error']="action \"".$actionName."\" is not recognized";
        break;
}
echo json_encode($resp);
?>