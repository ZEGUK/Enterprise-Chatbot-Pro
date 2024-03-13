import { useEffect, useRef, useState } from "react";
import { Checkbox, Panel, DefaultButton, Spinner, TextField, SpinButton, IDropdownOption, Dropdown } from "@fluentui/react";

import styles from "./OneShot.module.css";
import customlogo from "../../assets/logo.svg";

import { askApi, configApi, ChatAppResponse, ChatAppRequest, RetrievalMode, VectorFieldOptions, GPT4VInput } from "../../api";
import { Answer, AnswerError } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton/SettingsButton";
import { useLogin, getToken, isLoggedIn, requireAccessControl } from "../../authConfig";
import { VectorSettings } from "../../components/VectorSettings";
import { GPT4VSettings } from "../../components/GPT4VSettings";

import { useMsal } from "@azure/msal-react";
import { TokenClaimsDisplay } from "../../components/TokenClaimsDisplay";

const OneShot = () => {
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [promptTemplatePrefix, setPromptTemplatePrefix] = useState<string>("");
    const [promptTemplateSuffix, setPromptTemplateSuffix] = useState<string>("");
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(RetrievalMode.Hybrid);
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(true);
    const [useGPT4V, setUseGPT4V] = useState<boolean>(false);
    const [gpt4vInput, setGPT4VInput] = useState<GPT4VInput>(GPT4VInput.TextAndImages);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [question, setQuestion] = useState<string>("");
    const [vectorFieldList, setVectorFieldList] = useState<VectorFieldOptions[]>([VectorFieldOptions.Embedding, VectorFieldOptions.ImageEmbedding]);
    const [useOidSecurityFilter, setUseOidSecurityFilter] = useState<boolean>(false);
    const [useGroupsSecurityFilter, setUseGroupsSecurityFilter] = useState<boolean>(false);
    const [showGPT4VOptions, setShowGPT4VOptions] = useState<boolean>(false);

    const lastQuestionRef = useRef<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();
    const [answer, setAnswer] = useState<ChatAppResponse>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const client = useLogin ? useMsal().instance : undefined;

    const getConfig = async () => {
        const token = client ? await getToken(client) : undefined;

        configApi(token).then(config => {
            setShowGPT4VOptions(config.showGPT4VOptions);
        });
    };

    useEffect(() => {
        getConfig();
    }, []);

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        const token = client ? await getToken(client) : undefined;

        try {
            const request: ChatAppRequest = {
                messages: [
                    {
                        content: question,
                        role: "user"
                    }
                ],
                context: {
                    overrides: {
                        prompt_template: promptTemplate.length === 0 ? undefined : promptTemplate,
                        prompt_template_prefix: promptTemplatePrefix.length === 0 ? undefined : promptTemplatePrefix,
                        prompt_template_suffix: promptTemplateSuffix.length === 0 ? undefined : promptTemplateSuffix,
                        exclude_category: excludeCategory.length === 0 ? undefined : excludeCategory,
                        top: retrieveCount,
                        retrieval_mode: retrievalMode,
                        semantic_ranker: useSemanticRanker,
                        semantic_captions: useSemanticCaptions,
                        use_oid_security_filter: useOidSecurityFilter,
                        use_groups_security_filter: useGroupsSecurityFilter,
                        vector_fields: vectorFieldList,
                        use_gpt4v: useGPT4V,
                        gpt4v_input: gpt4vInput
                    }
                },
                // ChatAppProtocol: Client must pass on any session state received from the server
                session_state: answer ? answer.choices[0].session_state : null
            };
            const result = await askApi(request, token);
            setAnswer(result);
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onPromptTemplatePrefixChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplatePrefix(newValue || "");
    };

    const onPromptTemplateSuffixChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplateSuffix(newValue || "");
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onRetrievalModeChange = (_ev: React.FormEvent<HTMLDivElement>, option?: IDropdownOption<RetrievalMode> | undefined, index?: number | undefined) => {
        setRetrievalMode(option?.data || RetrievalMode.Hybrid);
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onExampleClicked = (example: string) => {
        makeApiRequest(example);
        setQuestion(example);
    };

    const onShowCitation = (citation: string) => {
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveCitation(citation);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }
    };

    const onToggleTab = (tab: AnalysisPanelTabs) => {
        if (activeAnalysisPanelTab === tab) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }
    };

    const onUseOidSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseOidSecurityFilter(!!checked);
    };

    const onUseGroupsSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseGroupsSecurityFilter(!!checked);
    };

    return (
        <div className={styles.oneshotContainer}>
            <div className={styles.commandsContainer}>
                <SettingsButton className={styles.settingsButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
            </div>
            <div className={styles.oneshotTopSection}>
                {/* <SettingsButton className={styles.settingsButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} /> */}
                <img
                    src={customlogo}
                    width="200px"
                    height="200px"
                    aria-hidden="true"
                    aria-label="Chat logo"
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                <h3 className={styles.oneshotTitle}>即刻搜索</h3>
                <div className={styles.oneshotQuestionInput}>
                    <QuestionInput placeholder="请输入问题..." disabled={isLoading} initQuestion={question} onSend={question => makeApiRequest(question)} />
                </div>
            </div>
            <div className={styles.oneshotBottomSection}>
                {isLoading && <Spinner label="答案生成中" />}
                {/* {!lastQuestionRef.current && <ExampleList onExampleClicked={onExampleClicked} useGPT4V={useGPT4V} />} */}
                {!isLoading && answer && !error && (
                    <div className={styles.oneshotAnswerContainer}>
                        <Answer
                            answer={answer}
                            isStreaming={false}
                            onCitationClicked={x => onShowCitation(x)}
                            onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab)}
                            onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab)}
                        />
                    </div>
                )}
                {error ? (
                    <div className={styles.oneshotAnswerContainer}>
                        <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
                    </div>
                ) : null}
                {activeAnalysisPanelTab && answer && (
                    <AnalysisPanel
                        className={styles.oneshotAnalysisPanel}
                        activeCitation={activeCitation}
                        onActiveTabChanged={x => onToggleTab(x)}
                        citationHeight="600px"
                        answer={answer}
                        activeTab={activeAnalysisPanelTab}
                    />
                )}
            </div>

            <Panel
                headerText="配置答案生成"
                isOpen={isConfigPanelOpen}
                isBlocking={false}
                onDismiss={() => setIsConfigPanelOpen(false)}
                closeButtonAriaLabel="关闭"
                onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                isFooterAtBottom={true}
            >
                <TextField
                    className={styles.oneshotSettingsSeparator}
                    defaultValue={promptTemplate}
                    label="重写提示模板"
                    multiline
                    autoAdjustHeight
                    onChange={onPromptTemplateChange}
                />
                <SpinButton
                    className={styles.oneshotSettingsSeparator}
                    label="检索如下数量的搜索结果："
                    min={1}
                    max={50}
                    defaultValue={retrieveCount.toString()}
                    onChange={onRetrieveCountChange}
                />
                <TextField className={styles.oneshotSettingsSeparator} label="排除类别" onChange={onExcludeCategoryChanged} />
                <Checkbox
                    className={styles.oneshotSettingsSeparator}
                    checked={useSemanticRanker}
                    label="使用语义排序器进行检索"
                    onChange={onUseSemanticRankerChange}
                />
                <Checkbox
                    className={styles.oneshotSettingsSeparator}
                    checked={useSemanticCaptions}
                    label="使用查询上下文摘要代替整个文档"
                    onChange={onUseSemanticCaptionsChange}
                    disabled={!useSemanticRanker}
                />

                {showGPT4VOptions && (
                    <GPT4VSettings
                        gpt4vInputs={gpt4vInput}
                        isUseGPT4V={useGPT4V}
                        updateUseGPT4V={useGPT4V => {
                            setUseGPT4V(useGPT4V);
                        }}
                        updateGPT4VInputs={inputs => setGPT4VInput(inputs)}
                    />
                )}

                <VectorSettings
                    showImageOptions={useGPT4V && showGPT4VOptions}
                    updateVectorFields={(options: VectorFieldOptions[]) => setVectorFieldList(options)}
                    updateRetrievalMode={(retrievalMode: RetrievalMode) => setRetrievalMode(retrievalMode)}
                />

                {useLogin && (
                    <Checkbox
                        className={styles.oneshotSettingsSeparator}
                        checked={useOidSecurityFilter || requireAccessControl}
                        label="Use oid security filter"
                        disabled={!isLoggedIn(client) || requireAccessControl}
                        onChange={onUseOidSecurityFilterChange}
                    />
                )}
                {useLogin && (
                    <Checkbox
                        className={styles.oneshotSettingsSeparator}
                        checked={useGroupsSecurityFilter || requireAccessControl}
                        label="Use groups security filter"
                        disabled={!isLoggedIn(client) || requireAccessControl}
                        onChange={onUseGroupsSecurityFilterChange}
                    />
                )}
                {useLogin && <TokenClaimsDisplay />}
            </Panel>
        </div>
    );
};
export default OneShot;
