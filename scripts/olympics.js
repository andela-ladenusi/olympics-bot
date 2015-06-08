var _ = require('lodash');

module.exports = function (robot) {
	robot.hear(/hello/i, function (res) {
		return res.send('Hi there!');
	});

	robot.router.post('/notification', function (req, res) {
		if(req.body) {
			// get team owner and the user that wants to join a team
			var owner 	= req.body.owner,
					joiner 	= req.body.joiner;

			// get all the users from the Andela team on Slack
			robot.http('https://slack.com/api/users.list?token=xoxb-5131687015-hukyBIAns8TPDRPFi369ol94')
			.get()(function (err, resp, data) {
				if (err) {
          console.log('Encountered an error!');
          return res.send(err);
        }

        var i, andela 	= JSON.parse(data),
        		acceptUrl = 'http://localhost:8080/makeHttpRequest/accept?team=' + owner.id + '&member=' + joiner.id,
	      		rejectUrl = 'http://localhost:8080/makeHttpRequest/reject?team=' + owner.id + '&member=' + joiner.id;

        for (i = 0; i < andela.members.length; i++) {
        	var slack_user = andela.members[i];

        	// check if the owner of the team has a slack profile
	        if(slack_user.profile.email === owner.email) {
	        	
	        	var sendSlackMessage 	= robot.emit('slack.attachment', {
						  content							: {
						    fallback					: 'Do you want to accept this user in your team?',
						  	pretext						: '`' + joiner.name + '`' + ' just joined your team.',
						  	author_name				: 'Andela Olympics',
						  	author_link				: 'http://bot-olympics.herokuapp.com',
						  	author_icon				: 'http://bot-olympics.herokuapp.com/img/olympic.png',
						    text							: '<' + acceptUrl + '|Accept User>\n<' + rejectUrl + '|Reject User>',
						    mrkdwn_in					: ['text', 'pretext'],
						  	unfurl_links			: true
						  },
						  channel							: slack_user.name
						});

	        	if (sendSlackMessage) {
							res.send('User has been notified!!');
	        	}
	        }
	      }
			});
		}
	});
	
	robot.router.get('/makeHttpRequest/:action', function (req, res) {
		var action 			= req.params.action,
				team_id 		= req.query.team,
				member_id 	= req.query.member,
				url 				= 'http://localhost:5555/competitions/Bot Olympics/teams/' + team_id + '/members/' + member_id;

		if (action === 'accept') {
			robot.http(url)
			.put()(function (err, resp, data) {
				if (err) {
					return res.send(err);
				}
				else if (data.error) {
					res.json(data.error);
				}
				sendSlackNotification(team_id, member_id, action);
				res.send('<html><body style="padding:20px;text-align:center;color:#767676;"><h3>User has been accepted.</h3><script>setTimeout(function(){window.close();},200);</script></body></html>');
			});
		}
		else if (action === 'reject') {
			robot.http(url)
			.delete()(function (err, resp, data) {
				if (err) {
					return res.send(err);
				}
				else if (data.error) {
					res.json(data.error);
				}
				sendSlackNotification(team_id, member_id, action);
				res.send('<html><body style="padding:20px;text-align:center;color:#767676;"><h3>User has been rejected.</h3><script>setTimeout(function(){window.close();},200);</script></body></html>');
			});
		}
	});

	function sendSlackNotification (team_id, user_id, membership) {
		robot.http('https://slack.com/api/users.list?token=xoxb-5131687015-hukyBIAns8TPDRPFi369ol94')
		.get()(function (err, res, data) {
			if (err) {
        console.log('Encountered an error!');
        return err;
      }

      var i, andela = JSON.parse(data);

      robot.http('http://localhost:5555/users/' + user_id)
      .get()(function (err, res, data) {
      	if (err) {
      		return res.send(err);
      	}

      	var user = JSON.parse(data);
      	console.log('This is the user details: - ', user);

      	robot.http('http://localhost:5555/competitions/Bot Olympics/teams/' + team_id)
      	.get()(function (err, res, data) {
      		if (err) {
      			res.send(err);
      		}

      		var team = JSON.parse(data);
      		console.log('This is the team details: - ', team);

		      for (i = 0; i < andela.members.length; i++) {
		      	var slack_user = andela.members[i];

		        if(slack_user.profile.email === user.email) {
		        	
		        	var content = {
		        		pretext						: 'Your membership status',
		        		fallback					: 'Your membership status',
						  	author_name				: 'Andela Olympics',
						  	author_link				: 'http://bot-olympics.herokuapp.com',
						  	author_icon				: 'http://bot-olympics.herokuapp.com/img/olympic.png',
						    mrkdwn_in					: ['text', 'pretext'],
						  	unfurl_links			: true
							};

							if (membership === 'accept') {
								content.text = 'You have now been accepted into the `' + team.name.toUpperCase() + '`';
							}
							else if (membership === 'reject') {
								content.text = 'We are sorry, but the owner of the `' + team.name.toUpperCase() + 
															 '` group has declined your membership.' +
															 '\nPlease, feel free to join another team in the ' +
															 '<http://bot-olympics.herokuapp.com|competition>'
							}

		        	var sendMessage 	= robot.emit('slack.attachment', {
							  content					: content,
							  channel					: slack_user.name
							});

		        	if (sendMessage) {
								console.log('User has been notified!!');
								return;
		        	}
		        	else {
			        	console.log('Could not send notification');
			        	return;
			        }
		        }
		      }
		    });
	    });
		});
	}


	// function getRoomID (user_id, message) {
	// 	var url = 'https://slack.com/api/im.open?token=xoxb-5131687015-hukyBIAns8TPDRPFi369ol94&user=' + user_id;

 //    robot.http(url)
 //    .get()(function (err, res, body) {
 //      if(err) {
 //        return err;
 //      }
 //      var room = JSON.parse(body);
 //      // send slack message
 //      sendSlackMessage(room.channel.id, message);
 //    });
	// }

	// function sendSlackMessage (roomID, message) {
	// 	var url = 'https://slack.com/api/chat.postMessage?token=xoxb-5131687015-hukyBIAns8TPDRPFi369ol94&';
 //    url += 'channel=' + roomID + '&as_user=true&text=' + message;

 //    robot.http(url)
 //    .post()(function (error, res, data) {
 //     if (error) {
 //       return error;
 //     }
 //     console.log(data);
 //    });
	// }
};