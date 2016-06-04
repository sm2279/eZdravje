
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

  
/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
	sessionId = getSessionId();
	
    var ime;
    var priimek;
    var datumRojstva;
    var actlevel;
    var goal;
    var datumInUra;
	var telesnaVisina;
	var telesnaTeza;
  
  switch (stPacienta) {
      case 1:
            ime = "Jon";
            priimek = "Snow";
            datumRojstva = "1980-06-01";
            actlevel = "3";
            goal = "3";
            datumInUra = "2014-11-21T11:40Z";
        	telesnaVisina = "172";
        	telesnaTeza = "50";
          break;
      
      case 2:
            ime = "Tyrion";
            priimek = "Lannister";
            datumRojstva = "1970-12-11";
            actlevel = "2";
            goal = "1";
            datumInUra = "2014-11-21T11:40Z";
        	telesnaVisina = "140";
        	telesnaTeza = "60";
          break;
      
      case 3:
            ime = "Arya";
            priimek = "Stark";
            datumRojstva = "1995-09-15";
            actlevel = "4";
            goal = "2";
            datumInUra = "2014-11-21T11:40Z";
        	telesnaVisina = "165";
        	telesnaTeza = "58";
          break;
  };
  
  if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId},
		            {key: "activityLevel", value: actlevel},
		            {key: "goal", value: goal}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		        
		        var podatki = {
				// Struktura predloge je na voljo na naslednjem spletnem naslovu:
	    		// https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
			    "ctx/language": "en",
			    "ctx/territory": "SI",
			    "ctx/time": datumInUra,
			    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
			    "vital_signs/body_weight/any_event/body_weight": telesnaTeza
				};
				var parametriZahteve = {
				    ehrId: ehrId,
				    templateId: 'Vital Signs',
				    format: 'FLAT'
				};
				$.ajax({
				    url: baseUrl + "/composition?" + $.param(parametriZahteve),
				    type: 'POST',
				    contentType: 'application/json',
				    data: JSON.stringify(podatki),
				    success: function (res) {
				        $("#dodajMeritveVitalnihZnakovSporocilo").html(
		              "<span class='obvestilo label label-success fade-in'>" +
		              res.meta.href + ".</span>");
				    },
				    error: function(err) {
				    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
		            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
		            JSON.parse(err.responseText).userMessage + "'!");
				    }
				});
				
				
				var x = document.getElementById("preberiPredlogoBolnika");
			    var option = document.createElement("option");
			    option.text = ime + " " + priimek;
			    option.value = ehrId;
			    x.add(option);
		    }
		});
		
		
	}
	

  return 0;
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija

function generiraj(){
    generirajPodatke(1);
    generirajPodatke(2);
    generirajPodatke(3);
}

function preberiEHRodBolnika1() {
	var ehrId = $("#preberiEHRid").val();
	preberiEHRodBolnika(ehrId);
}

function preberiEHRodBolnika(ehrId) {
	sessionId = getSessionId();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
			    $("#kreirajIme").val(party.firstNames);
			    $("#kreirajPriimek").val(party.lastNames);
			    $("#kreirajDatumRojstva").val(party.dateOfBirth);
			    $("#preberiEHRid").val(ehrId);
			    //$("#kreirajStopnjoAktivnosti").val(party.partyAdditionalInfo["activityLevel"]);
			    //$("#kreirajCilj").val(party.partyAdditionalInfo["goal"]);
			    for (var i = 0; i < party.partyAdditionalInfo.length; i++){
				  // look for the entry with a matching `code` value
				  if (party.partyAdditionalInfo[i].key == "activityLevel"){
			    		$("#kreirajStopnjoAktivnosti").val(party.partyAdditionalInfo[i].value);
				  }
				  if (party.partyAdditionalInfo[i].key == "goal"){
			    		$("#kreirajCilj").val(party.partyAdditionalInfo[i].value);
				  }
				}
			    
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Oseba '" + party.firstNames + " " +
          party.lastNames + "' je bila izbrana.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
		$.ajax({
			url: baseUrl + "/view/" + ehrId + "/height",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
			    $("#kreirajVisino").val(data[0].height);
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
		$.ajax({
			url: baseUrl + "/view/" + ehrId + "/weight",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
			    $("#kreirajTezo").val(data[0].weight);
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
		
	}
}

function calculate() {
        
	
        var heightt = parseFloat($("#kreirajVisino").val());
        var weightt = parseFloat($("#kreirajTezo").val());
        var rojstni = $("#kreirajDatumRojstva").val();
        var acti = parseInt($("#kreirajStopnjoAktivnosti").val());
        var gol = parseInt($("#kreirajCilj").val());
        var age = getAge(rojstni);
        
        var bmr = calulateBMR(weightt,heightt,age);
        var tdee = calculateTDEE(acti,bmr);
        
        $("#bmr").text("BMR: " + Math.round(bmr));
        $("#tdee").text("TDEE: " + Math.round(tdee));
        
        var factor = getGoalFactor(gol);
        var carbs = (tdee * 0.7 * factor)/4;
        var protein = (tdee * 0.15 * factor)/4;
        var fat = (tdee * 0.15 * factor)/9;
        
        
	$("#tabela").html("<table id='macro_results_table'><thead><tr><th></th><th>Carbs</th><th>Protein</th><th>Fat</th>"+
		"<th class='macro_calories'>Calories</th></tr></thead><tbody><tr data-label='Grams per Day'><td>Grams per Day</td>"+
                        "<td id='carbs_per_day'>"+ Math.round(carbs) + "</td><td id='protein_per_day'>"+ Math.round(protein) + "</td><td id='fat_per_day'>"+ Math.round(fat) + "</td>"+
                        "<td id='calories_per_day' class='macro_calories'>"+ Math.round(tdee*factor) + "</td>"+
                    "</tr><tr data-label='Grams per Meal'><td>Grams per Meal</td><td id='carbs_per_meal'>"+ Math.round(carbs/3) + "</td>"+
                     "   <td id='protein_per_meal'>"+ Math.round(protein/3) + "</td><td id='fat_per_meal'>"+ Math.round(fat/3) + "</td>"+
                      "  <td id='calories_per_meal' class='macro_calories'>"+ Math.round(tdee*factor/3) + "</td> </tr></tbody></table>");
}

function getGoalFactor(goal){
        switch (goal) {
        	case 1:
        		return 0.85;
        		break;
        	case 2:
        		return 1;
        		break;
        	case 3:
        		return 1.05;
        		break;
        }
}

function calulateBMR(weight, height, age) {
	return 66 + ( 13.7 * weight) + ( 5 * height) - ( 6.8 * age);
}

function calculateTDEE(activitiyLevel,BMR) {
	switch (activitiyLevel) {
		case 1:
			return 1.2 * BMR;
			break;
		case 2:
			return 1.375 * BMR;
			break;
		case 3:
			return 1.55 * BMR;
			break;
		case 4:
			return 1.725 * BMR;
			break;
	}
}

function _calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getAge(dateString) 
{
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) 
    {
        age--;
    }
    return age;
}

$(document).ready(function() {

  $('#preberiPredlogoBolnika').change(function() {
  	
    var podatki = $(this).val().split(",");
	preberiEHRodBolnika(podatki[0]);
  });
});

var map;
var infowindow;

function initMap() {
  var pyrmont = {lat: 46.0518, lng: 14.5077};

  map = new google.maps.Map(document.getElementById('map'), {
    center: pyrmont,
    zoom: 15
  });

  infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: pyrmont,
    radius: 500,
    type: ['food']
  }, callback);
}

function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}