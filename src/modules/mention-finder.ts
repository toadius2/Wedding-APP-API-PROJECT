export default function findMentionedUser(content: string): Array<String> {
    let results = content.match(/@[a-z0-9A-Z_\-\d]+/ig);
    if (results != null) {
        return results.map(r => {
            return r.substr(1);
        });
    }
    return [];
}
