import json
import pandas

data = pandas.read_csv('anime.csv', sep='\t')

data = data.drop('synopsis', axis=1)
data = data.drop('main_pic', axis=1)
data = data.drop('type', axis=1)
data = data.drop('num_episodes', axis=1)
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

data['season'] = data['season'].apply(lambda season: season.split(" ")[1])
data = data.rename(columns={"season": "year"})
data = data[data.year != 'None']
data['year'] = data['year'].apply(lambda year: int(year))
data = data[(data.year >= 2000) & (data.year < 2010)]

data['genres'] = data['genres'].apply(lambda genres: genres.split("|"))

data = data.sort_values('year')

data = data.drop('score_count', axis=1)

data_dict = data.to_dict(orient='records')

out_file = open("data.json", "w")
out_file.write(json.dumps(data_dict, indent=2))
out_file.close()
