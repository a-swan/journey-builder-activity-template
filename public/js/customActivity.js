define([
    'postmonger'
], function (
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();
    var authTokens = {};
    var payload = {};
    //fields in the form
    var fields = ["channel", "campaign", "treatment", "description", "message", "emailid", "sender", "program", "campaign_code", "jira", "production", "cell", "production", "campaigns", "partner", "validity"];	
    $(window).ready(onRender);
    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('clickedNext', beforeSave);
    connection.on('requestedTriggerEventDefinition', function(eventDefinitionModel) {var eventKey = eventDefinitionModel["eventDefinitionKey"]; save(eventKey);});
    function onRender() {
	connection.trigger('ready');
	connection.trigger('requestTokens');
	$('#description').change(function() {
		checkRequiredFields();
	});
        $('#campaign_code').change(function() {
                checkRequiredFields();
        });
        $('#jira').change(function() {
                checkRequiredFields();
        });
    }
    
    //Checks if required fields are filled abd updates the update button
    function checkRequiredFields(){
	var description = $('#description').attr('value').trim();
	var campaign_code = $('#campaign_code').attr('value').trim();
	var jira = $('#jira').attr('value').trim();

	connection.trigger('updateButton', { button: 'next', enabled: Boolean(description) && Boolean(campaign_code) && Boolean(jira) });
    }

    function initialize(data) {
        if (data) {
            payload = data;
        }
        
        var campaign, treatment, description;
        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        $.each(inArguments, function (index, inArgument) {
            $.each(inArgument, function (key, val) {		
                if (fields.indexOf(key) != -1){
                    $('#'+key).val(val);		  
                    if(key == "program"){
                        document.getElementById('cprogram').value = val;
                    }

                }			
            });
        });
        
        connection.trigger('updateButton', {
            button: 'next',
            text: 'done',
            visible: true,
        });
	    //Check required fields on load
        checkRequiredFields(); 
    }

    function onGetTokens(tokens) {
        authTokens = tokens;
    }

    function beforeSave(){
	connection.trigger('requestTriggerEventDefinition');
    }

    function save(eventKey) {
		//Dynamic parameters
		var params = {email: "{{InteractionDefaults.Email}}", sk: "{{Contact.key}}", phone: '{{Event.'+eventKey+'.Mobile_Phone}}'} ;
				

		//Telesales parameters
		if($('#channel').val()=="TELESALES"){
			var tsFields = ['BPN', 'ETUNIMET', 'SUKUNIMI', 'LAHTOKATU', 'LAHTOPOSTINUMERO', 'LAHTOPOSTITOIMIPAIKKA', 'MUUTTO_OSOITE', 'MUUTTO_POSTINUMERO', 'MUUTTO_POSTITOIMIPAIKKA', 'MUUTTO_PVM', 'CONTACT_PHONE'];
			for (var x = 0; x<tsFields.length; x++){
                        	params[tsFields[x]] = '{{Event.'+eventKey+'.'+tsFields[x]+'}}';
                	}
		}
		
		if($('#channel').val()=="LETTER"){
			var letterFields = [CUST_BPN,KIRJEKOODI,KIELI,CUST_NAME,KATUOSOITE,POSTINUMERO,POSTITOIMIPAIKKA,ASENNUSOSOITE,LONG_SUBS_NO,PÄÄKÄYTTÄJÄTUNNUS,TUOTENIMI_VANHA,TUOTENIMI_UUSI,MÄÄRÄAIKAINEN_PVM,ETUHINTA_PVM,MUUTOS_PVM,OMINAISUUDET_1,OMINAISUUDET_2,OMINAISUUDET_3,E-LASKU,TAULUKKO,PUHELUT_VANHA,PUHELUT_UUSI,VIESTIT_VANHA,VIESTIT_UUSI,NETTINOPEUS_VANHA,NETTINOPEUS_UUSI,KOTIMAA_NETTI_VANHA,KOTIMAA_NETTI_UUSI,EU_NETTI_VANHA,EU_NETTI_UUSI,HINTA_VANHA,HINTA_UUSI,TARJOUSHINTA_VANHA,TARJOUSHINTA_UUSI,TELIA_LIITTYMÄ,KESKITTÄJÄ,LAKITEKSTI,SHEET_1,SHEET_2,SHEET_3,FREETEXT_1,FREETEXT_2,FREETEXT_3,EU_FUP_NEW,EU_FUP_OLD,TOPUP_PRICE_NEW,TOPUP_PRICE_OLD,TOPUP_NEW,TOPUP_OLD,SOPIMUSTYYPPI,CUST_LIFEPHASE,IRTISANOMISLAUSE,FREE_DATE,MARKKINOINTI]
                        for (var x = 0; x<letterFields.length; x++){
                               params[letterFields[x]] = '{{Event.'+eventKey+'.'+letterFields[x]+'}}';
                        }
			
		}
		//Parameters from the form
		for (var x = 0; x<fields.length; x++){
			params[fields[x]] = $('#'+fields[x]).val();
		}
		params["selected_message"] = $('#msg-name-select :selected').text();
		
		
		var personalizations = getPersonalizations($('#message').val());
		//Personalizations for SMS
		for (var x = 0; x < personalizations.length; x++){
			params[personalizations[x]] = '{{Event.'+eventKey+'.'+personalizations[x].substring(2, personalizations[x].length-2)+'}}';

		}


		//Pass arguments to excecute method        	
		payload['arguments'].execute.inArguments = [params];
          	payload['metaData'].isConfigured = true;
        		connection.trigger('updateActivity', payload);
    }
    //returns all personalization strings in the given message
    function getPersonalizations(message){
	
	var locations = [];
	var strings = []
	for(var x = 0; x < message.length-1; x++){
		if(message.charAt(x) == "%" && message.charAt(x+1) == "%"){
				locations.push(x);
		}
	}

	for(var x = 0; x < locations.length; x = x + 2){
		strings.push(message.substring(locations[x], locations[x+1]+2));
	}
	return strings;

    }	



});
