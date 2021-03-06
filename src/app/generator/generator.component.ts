import {Component, HostListener, OnInit} from "@angular/core";
import {FormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute} from "@angular/router";

import {GeneratorService, GuideDataService, Module, Template} from '../components/providers';

@Component({
  selector: "generator",
  templateUrl: "./generator.component.html",
  styleUrls: ["./generator.component.scss", "./generator.component.select.scss"]
})
export class GeneratorComponent implements OnInit {

  // https://ng-select.github.io/ng-select#/multiselect-checkbox

  advancedMode = false;
  genForm = null;
  snowdropVersions = [];
  defaultSpringBootVersion: string = null;
  templates: Template[];
  modules: UIModule[] = [];
  supported = false;
  relatedGuides = [];
  showGuidesOverlay = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private gs: GeneratorService,
    private guideService: GuideDataService,
  ) {
  }

  categories: any[];

  ngOnInit(): void {
    let configObservable = this.gs.getGeneratorConfig()
      .map(config => {
        if (config.bomversions) {
          for (let version of config.bomversions) {
            console.log("Version", version);
            this.snowdropVersions.push(version);

            if (version.default) {
              this.defaultSpringBootVersion = version.community;
            }
          }
        }

        this.templates = config.templates;

        this.initForm();

        return this.defaultSpringBootVersion
      });

    // use the output of the configObservable which produces the defined default SB version as input to
    // populate compatible modules with that version
    configObservable.switchMap(version => this.gs.getModulesFor(version))
      .subscribe(gsModules => this.setModules(gsModules));
  }

  @HostListener('document:keypress', ['$event'])
  private onKeyDown(e) {
    console.log("Keydown", e);
    if (e.ctrlKey && e.key == "Enter") {
      console.log('ctrl and enter');
      this.generate();
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onEscapePressed(event: KeyboardEvent) {
    console.log(event);
    this.showGuidesOverlay = false;
  }

  initForm() {
    const gaPattern = /^([a-z0-9-_]+\.)*[a-z0-9-_]+$/i;
    const vPattern = /^([a-z0-9-_]+\.)*[a-z0-9-_]+$/i;
    const pPattern = /^([a-z0-9-_$]+\.)*[a-z0-9-_$]+$/i;

    this.route.queryParams.subscribe((params) => {
      console.log("Initializing Form");
      this.genForm = this.fb.group({
        groupid: [params["groupid"] || 'com.example', [Validators.required, Validators.pattern(gaPattern)]],
        artifactid: [params["artifactid"] || 'demo', [Validators.required, Validators.pattern(gaPattern)]],
        version: [params["version"] || "0.0.1-SNAPSHOT", [Validators.required, Validators.pattern(vPattern)]],
        packagename: [params["packagename"] || "com.example.demo", [Validators.required, Validators.pattern(pPattern)]],
        springbootversion: [params["springbootversion"] || this.defaultSpringBootVersion, [Validators.required]],
        supported: [params["supported"]],
        ap4k: [params["ap4k"]],
        template: [params["template"] || 'custom', [Validators.required]],
        modules: [this.getModules(params["module"]) || null, []]
      });
    });

  }

  getModules(names) {
    console.log("Dependency", names);
    let result = [];
    if (!Array.isArray(names)) {
      names = [names];
    }
    for (let dep of this.modules) {
      for (let name of names) {
        if (dep.value === name) {
          result.push(dep);
        }
      }
    }
    return result;
  }

  isModulesEnabled() {
    return this.genForm && this.genForm.controls['template'].value === "custom";
  }

  searchModules(term: string, item) {
    term = term.toLocaleLowerCase();
    let tagMatched = false;
    if (item.tags) {
      for (let t of item.tags) {
        if (t.toLocaleLowerCase().indexOf(term) > -1) {
          tagMatched = true;
        }
      }
    }
    return tagMatched || item.name.toLocaleLowerCase().indexOf(term) > -1 || item.description.toLocaleLowerCase().indexOf(term) > -1;
  }

  selectTemplate(t) {
    this.genForm.controls['template'].setValue(t);
  }

  getTemplate() {
    for (let t of this.templates) {
      if (t.name === this.genForm.controls['template'].value) {
        return t;
      }
    }
    return {description: "", tags: []};
  }

  getTemplateDescription() {
    return this.getTemplate().description;
  }

  canGenerate() {
    return this.genForm.valid;
  }

  generate() {
    if (this.canGenerate()) {
      let values = JSON.parse(JSON.stringify(this.genForm.value));

      console.log("Submitted", values);

      if (values.modules) {
        values.module = values.modules.map(d => d.value);
        values.modules = undefined;
      }
      setTimeout(() => {
        this.gs.generate(values);
      }, 600);

      return this.displayRelatedGuides(values.module).then(() => {
        console.log("Generating", values);
      });
    }
  }

  displayRelatedGuides(modules) {
    return this.guideService.ready().then(() => {
      let guideData = {
        tags: []
      };
      console.log("Modules selected", modules);
      for (let selected of modules) {
        for (let m of this.modules) {
          if (m.value === selected) {
            console.log("Module matched", m);
            guideData.tags = guideData.tags.concat(m.tags);
          }
        }
      }

      console.log("Guide data", guideData);
      this.relatedGuides = this.guideService.getRelatedGuides(guideData);
      if (this.relatedGuides && this.relatedGuides.length > 4) {
        this.relatedGuides.length = 4;
      }
      this.showGuidesOverlay = true;
      console.log("Related guides", this.relatedGuides)
    });
  }

  onVersionChange(newVersion: string) {
    // disable supported checkbox if this version is not supported
    if (!this.isSupportedVersion(newVersion)) {
      document.getElementById("supported").setAttribute("disabled", "true")
    } else {
      document.getElementById("supported").removeAttribute("disabled")
    }

    // refresh compatible modules list
    this.refreshModulesFor(newVersion);
  }

  private refreshModulesFor(version: string) {
    this.gs.getModulesFor(version).subscribe(gsModules => this.setModules(gsModules))
  }

  private setModules(gsModules: Module[]) {
    this.modules = gsModules.map(m => new UIModule(m))
  }

  private getSupportedVersionFor(sbVersion: string): string {
    for (let version of this.snowdropVersions) {
      if (sbVersion === version.community) {
        return version.supported;
      }
    }
    return "";
  }

  private isSupportedVersion(sbVersion: string): boolean {
    return this.getSupportedVersionFor(sbVersion) !== ""
  }

  onSupportedChange(target) {
    if (target.checked) {
      this.genForm.controls['supported'].setValue('true');
    }
  }

  onAp4kChange(target) {
    if (target.checked) {
      this.genForm.controls['ap4k'].setValue('true');
    }
  }
}

class UIModule extends Module {
  value: string;
  tag: string;

  constructor(module: Module) {
    super(module);
    this.value = module.name;
    this.tag = module.tags[0];
  }
}