const url = "https://data.mobilites-m.fr/api/routers/default/plan";

const data = JSON.stringify({
    "fromPlace": "45.1871312,5.7279306",
    "toPlace": "45.193287, 5.7683957"
})

const body = { data };

fetch(`${url}?fromPlace=45.1871312,5.7279306&toPlace=45.193287,5.7683957`, {
    method: "GET",
}).then(res => res.json())
    .then(res => res.plan.itineraries.forEach(itinerarie => {
        console.log(itinerarie.legs);
    }));