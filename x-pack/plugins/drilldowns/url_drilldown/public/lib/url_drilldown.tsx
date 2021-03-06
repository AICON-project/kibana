/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { getFlattenedObject } from '@kbn/std';
import { reactToUiComponent } from '../../../../../../src/plugins/kibana_react/public';
import {
  ChartActionContext,
  CONTEXT_MENU_TRIGGER,
  IEmbeddable,
} from '../../../../../../src/plugins/embeddable/public';
import { CollectConfigProps as CollectConfigPropsBase } from '../../../../../../src/plugins/kibana_utils/public';
import {
  ROW_CLICK_TRIGGER,
  SELECT_RANGE_TRIGGER,
  VALUE_CLICK_TRIGGER,
} from '../../../../../../src/plugins/ui_actions/public';
import {
  UiActionsEnhancedDrilldownDefinition as Drilldown,
  UrlDrilldownGlobalScope,
  UrlDrilldownConfig,
  UrlDrilldownCollectConfig,
  urlDrilldownValidateUrlTemplate,
  urlDrilldownCompileUrl,
  UiActionsEnhancedBaseActionFactoryContext as BaseActionFactoryContext,
} from '../../../../ui_actions_enhanced/public';
import { getPanelVariables, getEventScope, getEventVariableList } from './url_drilldown_scope';
import { txtUrlDrilldownDisplayName } from './i18n';

interface UrlDrilldownDeps {
  getGlobalScope: () => UrlDrilldownGlobalScope;
  navigateToUrl: (url: string) => Promise<void>;
  getSyntaxHelpDocsLink: () => string;
  getVariablesHelpDocsLink: () => string;
}

export type ActionContext = ChartActionContext;
export type Config = UrlDrilldownConfig;
export type UrlTrigger =
  | typeof VALUE_CLICK_TRIGGER
  | typeof SELECT_RANGE_TRIGGER
  | typeof ROW_CLICK_TRIGGER
  | typeof CONTEXT_MENU_TRIGGER;

export interface ActionFactoryContext extends BaseActionFactoryContext<UrlTrigger> {
  embeddable?: IEmbeddable;
}
export type CollectConfigProps = CollectConfigPropsBase<Config, ActionFactoryContext>;

const URL_DRILLDOWN = 'URL_DRILLDOWN';

export class UrlDrilldown implements Drilldown<Config, UrlTrigger, ActionFactoryContext> {
  public readonly id = URL_DRILLDOWN;

  constructor(private deps: UrlDrilldownDeps) {}

  public readonly order = 8;

  readonly minimalLicense = 'gold';
  readonly licenseFeatureName = 'URL drilldown';
  readonly isBeta = true;

  public readonly getDisplayName = () => txtUrlDrilldownDisplayName;

  public readonly euiIcon = 'link';

  supportedTriggers(): UrlTrigger[] {
    return [VALUE_CLICK_TRIGGER, SELECT_RANGE_TRIGGER, ROW_CLICK_TRIGGER, CONTEXT_MENU_TRIGGER];
  }

  private readonly ReactCollectConfig: React.FC<CollectConfigProps> = ({
    config,
    onConfig,
    context,
  }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const variables = React.useMemo(() => this.getVariableList(context), [context]);
    return (
      <UrlDrilldownCollectConfig
        variables={variables}
        config={config}
        onConfig={onConfig}
        syntaxHelpDocsLink={this.deps.getSyntaxHelpDocsLink()}
        variablesHelpDocsLink={this.deps.getVariablesHelpDocsLink()}
      />
    );
  };

  public readonly CollectConfig = reactToUiComponent(this.ReactCollectConfig);

  public readonly createConfig = () => ({
    url: { template: '' },
    openInNewTab: false,
  });

  public readonly isConfigValid = (config: Config): config is Config => {
    return !!config.url.template;
  };

  public readonly isCompatible = async (config: Config, context: ActionContext) => {
    const scope = this.getRuntimeVariables(context);
    const { isValid, error } = urlDrilldownValidateUrlTemplate(config.url, scope);

    if (!isValid) {
      // eslint-disable-next-line no-console
      console.warn(
        `UrlDrilldown [${config.url.template}] is not valid. Error [${error}]. Skipping execution.`
      );
    }

    return Promise.resolve(isValid);
  };

  public readonly getHref = async (config: Config, context: ActionContext) => {
    const scope = this.getRuntimeVariables(context);
    return urlDrilldownCompileUrl(config.url.template, scope);
  };

  public readonly execute = async (config: Config, context: ActionContext) => {
    const url = urlDrilldownCompileUrl(config.url.template, this.getRuntimeVariables(context));
    if (config.openInNewTab) {
      window.open(url, '_blank', 'noopener');
    } else {
      await this.deps.navigateToUrl(url);
    }
  };

  public readonly getRuntimeVariables = (context: ActionContext) => {
    return {
      ...this.deps.getGlobalScope(),
      context: {
        panel: getPanelVariables(context),
      },
      event: getEventScope(context),
    };
  };

  public readonly getVariableList = (context: ActionFactoryContext): string[] => {
    const eventVariables = getEventVariableList(context);
    const contextVariables = Object.keys(getFlattenedObject(getPanelVariables(context))).map(
      (key) => 'context.panel.' + key
    );
    const globalVariables = Object.keys(getFlattenedObject(this.deps.getGlobalScope()));

    return [...eventVariables.sort(), ...contextVariables.sort(), ...globalVariables.sort()];
  };
}
