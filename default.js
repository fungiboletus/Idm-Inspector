{
	"sensors":
	{
		"Bike1_speed" : "Bike1/ground_speed",
		"Bike1_altitude" : "http://demo.sensapp.org:80/sensapp/databases/raw/data/Bike1/altitude",
		"Bike1_GPS" : "sensapp:lat|http://54.247.172.50:80/sensapp/databases/raw/data/Bike1/latitude|lon|http://54.247.172.50:80/sensapp/databases/raw/data/Bike1/longitude",
		"Bike1_Video" : "video:1337853610|800|http://localhost/InspecteurDeryque/sample.mov"
	},
	"composite_v" : [{
		"composite_h" : [{
			"composite_v" : [{
				"composite_h" : [{"DigitalLCD" : ["Bike1_speed","Bike1_altitude"]}
			]},{
				"composite_v" : [{"Tachometer" : ["Bike1_speed"]}
			]}
		]},{
			"composite_h" : [{"LineChart" : ["Bike1_speed","Bike1_altitude"]}
		]}
	]},{
		"composite_h" : [{
			"composite_h" : [{"Map" : ["Bike1_GPS"]}
		]},{
			"composite_h" : [{"Video" : ["Bike1_Video"]}
		]}
	]}
]
}