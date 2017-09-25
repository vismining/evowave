Evowave
=======

An open-source information visualization tool to portray evolutionary data.

In the website, http://vismining.github.io/evowave, you can see more information about this tool, 
include examples of its usage in the context of software evolution visualization. 

How to run?
You need a server to run the Evowave.

Here we explain the use of Evowave in two server applications.

### Using http-server, from Node.js
1. Install http-server (https://www.npmjs.com/package/http-server/tutorial)
2. After installation, open the terminal/windows prompt and navigate to the Evowave/WebContent folder
3. Run http-server
4. You should see an example of Evowave.

### Using Eclipse
1. Import the project inside the Eclipse IDE
2. Configure your preferable Server. We tested using Apache Tomcat
3. Run (it) on Server 
4. You should see an example of Evowave. 

Please, contact us if you have any doubt!!

The data Evowave portrays, must be inside a json file, following the defined structure.

The jsons files are inside WebContent/json files

The first example we use here is WebContent/json/customProjectData.json

This is a mockup example, which has the following structure 

/*
    Project

    	setor1

    	setor2

    		a

    		b

            c

            d

                1

                2   	
*/
Inside the "data" property there are two defined properties "complexity" and "LOC". 
One can map any type/name of properties inside the "data" property.
    
You can filter the molecules using any of their data properties. In the case of 'customProjectData.json, 
you can change the line 6  
	"query": "", 
for 
	"query": "this.LOC > 400 && this.complexity < 5",

The Evowave will present only the molecules that match this criteria.

Evowave is extremely configurable. You can map whatever you want to properties like:
angle, color, amount of sectors, etc.