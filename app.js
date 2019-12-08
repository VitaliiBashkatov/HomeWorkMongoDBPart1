const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'local';

// Use connect method to connect to the server
MongoClient.connect(url, { useUnifiedTopology: true}, async function(err, client) {
    const db = client.db(dbName);
    const students = db.collection('students');
    const articles = db.collection('articles');

    //console.log('works :)');
  const worstHomeworkStudents = await students.find().sort({'scores.2.score': -1}).limit(10).toArray();
//  console.log(worstHomeworkStudents);
  const	bestQuizStudents = await students.find({'scores.1.score' : {$gt : 80}, 'scores.2.score': {$lt : 20}}).sort({'scores.1.score': 1}).toArray();
  //console.log(bestQuizStudents);
  const bestQuizExamStudents = await students.find({'scores.1.score' : {$gt: 80}, 'scores.0.score': {$gt: 80}}).toArray();
  //console.log(bestQuizExamStudents);
   
   const avg = await students.aggregate([
  {$unwind : '$scores'},
  {$match: {
  	'scores.type' : 'homework'
  	}
  },
  {		
    '$group' : {
    	'_id': null,
    	'avgHomework': {'$avg' : '$scores.score'}
    }
  }]).toArray();
//  console.log(avg);

  const deleted = await students.deleteMany({'scores.2.score' : {$lte: 60}});

  const marked = await students.updateMany({'scores.1.score' : {$gte: 80}}, {$set : {'excelentStudent': true}});

  const grouped = await students.aggregate([{
  	 $addFields: { 
            'rating_average': {
                $divide: [
                    { 
                        $reduce: {
                            input: '$scores',
                            initialValue: 0,
                            in: { '$add': ['$$value', '$$this.score'] }
                        }
                    },
                    { 
                        $cond: [
                            { '$ne': [ { '$size': '$scores' }, 0 ] },
                            { '$size': '$scores' }, 
                            1
                        ]
                    }
                ]
            }
        },     
   },

   {
   	 $addFields: {
	  	  'groupIndex': {
	  		 $switch: {
	  			branches : [
	  			  {case: {$lt : ['$rating_average' , 40]},
	  				then: 'a'
	  			  }	,
	  			  { case: {$lt: ['$rating_average',60]},
	  			    then: 'b'
	  			  },
	  			],
	  			default: 'c'
	  		 }
	  	   }
	  }
   },

  {$group : {
  	_id: '$groupIndex',
  	'count' : {$sum: 1}
  }

  }]).toArray();
 

console.log(grouped);
    client.close();
});
