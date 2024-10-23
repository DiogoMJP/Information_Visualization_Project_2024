import json
import pandas

data = pandas.read_csv('anime.csv', sep='\t')

data = data.drop('synopsis', axis=1)
data = data.drop('main_pic', axis=1)
data = data.drop(data[data.type != "TV"].index)
data = data.drop('type', axis=1)
data = data.drop('status', axis=1)
data = data.drop('start_date', axis=1)
data = data.drop('end_date', axis=1)
data = data.drop('studios', axis=1)
data = data.drop('score_rank', axis=1)
data = data.drop('popularity_rank', axis=1)

data['members_count'] = data['members_count'].apply(lambda members_count: int(members_count))

data = data.drop('favorites_count', axis=1)
data = data.drop('watching_count', axis=1)
data = data.drop('completed_count', axis=1)
data = data.drop('on_hold_count', axis=1)
data = data.drop('dropped_count', axis=1)
data = data.drop('plan_to_watch_count', axis=1)
data = data.drop('total_count', axis=1)
for x in range(1, 11): data = data.drop(f'score_{x:02}_count', axis=1)
data = data.drop('anime_url', axis=1)
data = data.drop('clubs', axis=1)
data = data.drop('pics', axis=1)

data = data.dropna()

data['year'] = data['season'].apply(lambda season: season.split(" ")[1])
data['season'] = data['season'].apply(lambda season: season.split(" ")[0].capitalize())
data = data[data.year != 'None']
data['year'] = data['year'].apply(lambda year: int(year))
data = data[(data.year >= 2000) & (data.year < 2010)]

data['genres'] = data['genres'].apply(lambda genres: genres.split("|"))
selected_genres = ["Action", "Adventure", "Avant Garde", "Award Winning",
				   "Comedy", "Drama","Fantasy", "Girls Love", "Horror",
				   "Mystery", "Romance", "Sci-Fi", "Sports", "Supernatural",
				   "Suspense"
					]
data['genres'] = data['genres'].apply(lambda genres: [g for g in genres if g in selected_genres])
data = data[data['genres'].map(len) > 0]
data = data.sort_values('title')

data = data.drop('score_count', axis=1)

data_dict = data.to_dict(orient='records')

out_file = open("data.json", "w")
out_file.write(json.dumps(data_dict, indent=2))
out_file.close()
