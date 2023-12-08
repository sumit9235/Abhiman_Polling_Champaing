# Abhiman_Polling_Champaing
A backend server for handling a polling application 

 # Implement API Endpoints
## Poll Creation (including adding question sets)
### Route: POST /polls
#### Creates a new poll with question sets.
## Fetching All Created Polls with Analytics
### Route: GET /polls
### Fetches all created polls with analytics.
## Updating a Particular Poll (Details and Question Sets)
### Route: PUT /polls/:pollId
#### Updates details and question sets of a particular poll.
## Fetching User Polls and Serving Questions One at a Time
### Route: GET /user-polls/:userId
#### Fetches polls for a user and serves questions based on their voting history.
## Submitting a Poll and Updating User Data, Rewarding the User, and Updating Poll Analytics
### Route: POST /polls/submit/:userId
#### Submits a poll for a user, updates user data, rewards the user, and updates poll analytics.
## Fetching Poll Analytics for a Particular Poll
### Route: GET /polls/:pollId/analytics
#### Fetches analytics for a particular poll, including total votes and option counts.
## Fetching Overall Poll Analytics
### Route: GET /polls/analytics
#### Fetches overall poll analytics, including total votes and option counts for all polls.
