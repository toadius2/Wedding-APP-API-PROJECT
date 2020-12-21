<<<<<<< HEAD
import { get } from "nconf";
import fetch from 'node-fetch'

export function gecode(address: string) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${get('GOOGLE_API_KEY')}`
    return fetch(url).then(t => t.json()).then((res) => {
        if (res.results && res.results.length) {
            let result = res.results[0].geometry.location as { lat: number, lng: number }
            return result
        }
        return undefined
    })
=======
import { get } from "nconf";
import fetch from 'node-fetch'

export function gecode(address: string) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${get('GOOGLE_API_KEY')}`
    return fetch(url).then(t => t.json()).then((res) => {
        if (res.results && res.results.length) {
            let result = res.results[0].geometry.location as { lat: number, lng: number }
            return result
        }
        return undefined
    })
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
}