<?php
$actionName=$_GET['action'];
$resp=Array();
$resp['debug']=Array('request'=>$_GET);
//TODO: should be dynamic, and take the last alphabetically, since others are older copies of the db.
$database=false;
$databaseColumns=false;
$dataAddr = './data/cards/00.csv';
function backupCheck($force=false){
    global $dataAddr;
    global $resp;
    $resp['database-backup-check']=Array();
    $dataFolder;
    preg_match("/([^\/]*\/)+/",$dataAddr,$dataFolder);
    $dataFolder=$dataFolder[0];
    $backups=scandir($dataFolder);
    rsort($backups);
    $newestBackup=intval($backups[0]);
    $resp['database-backup-check']['newest-backup']=$newestBackup;
    if($newestBackup+(7*24*60*600)<time() || $force){
        $naddr=$dataFolder."".time().".backpup.csv";
        copy ($dataAddr,$naddr);
        $resp['database-backup-check']['backup-performed']=$naddr;

    }
}
function readDatabase(){
    global $dataAddr;
    global $database;
    global $databaseColumns;
    $database=Array();
    $handle = fopen ($dataAddr,'r');
    $databaseColumns=fgetcsv ($handle);
    foreach($databaseColumns as $key=>$column){
        $databaseColumns[$key]=trim($column);
    }
    $stillReading=fgetcsv ($handle);//so we skip name row
    $itemNumber=0;
    while($stillReading){
        $database[$itemNumber]=Array();
        //build the "card" "objects" (array)
        foreach($databaseColumns as $key=>$column){
            $database[$itemNumber][$column]=trim($stillReading[$key]);
        }
        $stillReading=fgetcsv ($handle);
        $itemNumber++;
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
    //inefficient algorithm:
    while (true) {
        $used=false;
        foreach ($database as $key => $item) {
            if($item['unique']==$try){
                $used=true;
                break;
            }
        }
        if($used){
            $try++;
        }else{
            return $try;
        }
    }
}
function writeDatabase(){
    global $dataAddr;
    global $database;
    global $databaseColumns;
    backupCheck();
    try{
        $handle = fopen ($dataAddr,'w+');
        fputcsv($handle,$databaseColumns);
        foreach ($database as $key => $item) {
            if($item!==false)
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
    case 'backup':{
        backupCheck(true);
        break;
    }
    case 'write':{
        //TODO: should be a list, for consistency with "add" and for more economic saving of stuff.
        readDatabase();
        requireGetParameter('cards');
        $changed=false;
        foreach ($_GET['cards'] as $cardKey=>$inputCard) {
            $found=false;
            $isNew=false;
            //if unique is "new", then create new. currently untested
            if($inputCard['unique']=="new"){
                $isNew=true;
                $newUnique=getNewUnique();
                $newCard=Array();
                foreach($databaseColumns as $columnKey=>$column){
                    if(array_key_exists($column,$inputCard)){
                        $newCard[$column]=$inputCard[$column];
                    }else{
                            $database[$key][$column]="";
                    }
                };
                $newCard['unique']=$newUnique;
                array_push($database,$newCard);
                $found=true;         
                $resp['debug'][$newUnique]="created";
            }else{
                //if unique is not "new", then it means we are trying to edit an existing entry.
                foreach ($database as $key => $currentCard) {
                    if($currentCard['unique']==$inputCard['unique']){
                        $found=true;
                        foreach($databaseColumns as $columnKey=>$column){
                            if(array_key_exists($column,$inputCard)){
                                $database[$key][$column]=$inputCard[$column];
                            }else{
                                $database[$key][$column]="";
                            }
                        }
                        $resp['debug'][$currentCard['unique']]="modified";
                        break;
                    }
                }
            }
            if($found){
                $changed=true;
            }else{
                $resp['debug'][$cardKey]="nothing written: unique is not 'new' nor it existed in current database";
            }
        }
        if($changed){
            writeDatabase();
        }else{
            $resp['debug']['warn']="no changes done";
        }
        break;
    }
    case 'delete':{
        //TODO: should be a list, for consistency with "add" and for more economic saving of stuff.
        readDatabase();
        requireGetParameter('cards');
        $changed=false;
        foreach ($_GET['cards'] as $cardKey=>$inputCard) {
            $found=false;
            foreach ($database as $key => $currentCard) {
                if($currentCard['unique']==$inputCard['unique']){
                    $found=true;
                    $resp['debug'][$currentCard['unique']]="deleted";
                    unset($database[$key]);
                    break;
                }
            }
            if($found){
                $changed=true;
            }else{
                $resp['debug'][$cardKey]="nothing deleted: unique nonexistent in current database";
            }
        }
        if($changed){
            writeDatabase();
        }else{
            $resp['debug']['warn']="no changes done";
        }
        break;
    }
    // case 'add':{
    //     readDatabase();
    //     requireGetParameter('cards');
    //     $news=false;
    //     //change values in $database
    //     foreach ($_GET['cards'] as $item) {
    //         $nitm=Array();
    //         foreach($databaseColumns as $key=>$column){
    //             $nitm[$column]=$item[$column];
    //         }
    //         $nitm['unique']=getNewUnique();
    //         array_push($database,$nitm);
    //         $news=true;
    //     }
    //     if($news){
    //         //then write the $database
    //         writeDatabase();
    //     }else{
    //         $resp['error']="No valid list of new elements was provided. ";
    //     }
    //     break;
    // }
    case 'admin':{
        readDatabase();
        echo ("<h2>Manage entries:</h2>");
        echo ("<ul>");
        foreach($database as $key=>$item){
            echo ('<li>');
            echo ('<a href="?'.http_build_query(Array('action'=>'delete','cards'=>Array(Array('unique'=>$item['unique'])))).'">delete</a>');
            echo(' '.implode(", ",$item).'</li>');
        }
        echo ("</ul>");        
        echo ("<h2>Json response:</h2>");
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