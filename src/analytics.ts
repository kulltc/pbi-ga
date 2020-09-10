import { measure } from 'measurement-protocol'
 
// Initialize with Google Analytics Tracking ID / Web Property ID:

export class GoogleAnalytics {

    private tracker;

    constructor (code: string, host:string, pageName: string, tabName: string, parameters: object) {
        if (pageName == "" || tabName == "" || code == "") {
            throw "missing configuration!";
        }
        console.log(this.pagify(pageName, tabName));
        measure(code)
            .pageview(this.pagify(pageName, tabName))
            .set(parameters)
            .send()
            .then(() => {}, console.error);
    }

    private pagify (pageName: string, tabName: string): string {
        return '/'
         + this.strip(pageName)
         + '?tab=' + this.strip(tabName)
    }

    private strip(str: string): string {
        return str.replace(/\s/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '_')
        .toLowerCase()
    }
}