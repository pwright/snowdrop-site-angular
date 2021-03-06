import { Component } from "@angular/core";
import { Router } from "@angular/router";


export interface Page {
	name: string,
	id: string,
	route: string
}

@Component({
	selector: "app-header",
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"]
})
export class HeaderComponent {
	collapse: boolean;
	wizard: boolean;

	pages: Page[] = [
		{
			id: "home",
			name: "Home",
			route: "/"
		},
		{
			id: "get-started",
			name: "Get Started",
			route: "/guides/get-started"
		},
		{
			id: "guides",
			name: "Guides",
			route: "/guides"
		},
		{
			id: "about",
			name: "About",
			route: "/about"
		},
	];

  // 	{
	//		id: "news",
	//		name: "News",
	//		route: "/news"
	//	},
  
	constructor(private router: Router) {
		router.events.subscribe((url: any) => {
			this.collapse = false;
			if (url && url.url) {
				this.wizard = url.url.indexOf("wizard") > -1;
			}
		});

	}
}
