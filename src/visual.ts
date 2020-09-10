/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import icon from "./icon";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import {GoogleAnalytics} from './analytics';
import 'babel-polyfill'

import { VisualSettings } from "./settings";
import { min } from "../node_modules/@types/d3";
export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private xmlhttp: XMLHttpRequest = new XMLHttpRequest();
    private ga: GoogleAnalytics;
    private document: Document;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.updateCount = 0;
        if (document) {
            this.document = document;
            const new_p: HTMLElement = document.createElement("p");
            const html: string = icon;
            new_p.innerHTML = html;
            this.target.appendChild(new_p);
        }
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.settings.googleAnalyticsSettings.customDimensionIndexA = this.parseIndex(this.settings.googleAnalyticsSettings.customDimensionIndexA);
        this.settings.googleAnalyticsSettings.customDimensionIndexB = this.parseIndex(this.settings.googleAnalyticsSettings.customDimensionIndexB);
        this.settings.googleAnalyticsSettings.customDimensionIndexC = this.parseIndex(this.settings.googleAnalyticsSettings.customDimensionIndexC);
        if(!this.ga) {
            try {
                this.ga = new GoogleAnalytics(
                    this.settings.googleAnalyticsSettings.trackingCode,
                    this.document.location.host,
                    this.settings.googleAnalyticsSettings.pageName,
                    this.settings.googleAnalyticsSettings.tabName,
                    this.getCustomDimensions(options.dataViews[0])
                );
            } catch(exception) {
                console.log('an error occurred trying to connect to google analytics:');
                console.error(exception);
            }
        }
    }

    private parseIndex(index: string): string {
        if (index == "") {
            return "";
        }
        let indexNumber: number = parseInt(index);
        if (isNaN(indexNumber)) {
            indexNumber = 1;
        }
        indexNumber = Math.max(1, indexNumber);
        indexNumber = Math.min(200, indexNumber);
        return indexNumber.toString();
    }

    private getCustomDimensions(dataView: DataView) {
        let params = {};
        const dims = ["A", "B", "C"];
        for (let dimIndex in dims) {
            let dim = dims[dimIndex];
            if (this.settings.googleAnalyticsSettings["customDimensionIndex" + dim] == "") {
                continue;
            }
            for (let categoryIndex in dataView.categorical.values) {
                if(isNaN(parseInt(categoryIndex))) {
                    continue;
                }
                let categoryValue =  dataView.categorical.values[categoryIndex];
                if (categoryValue.source.roles["customDimension" + dim]) {
                    let paramName = "cd" + this.settings.googleAnalyticsSettings["customDimensionIndex" + dim];
                    params[paramName] = categoryValue.values.join(", ")
                }
            }
        }
        return params;
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}