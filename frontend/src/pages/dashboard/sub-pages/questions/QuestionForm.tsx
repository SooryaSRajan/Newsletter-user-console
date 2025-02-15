import React, {useEffect, useState} from "react";
import {
    GroupData,
    GroupRequest as GroupIdRequest
} from "../../../../redux/rootslices/api/groups.slice";
import {
    FormDataResponse, GroupQuestionsResponse,
    Questions, QuestionType,
    useGetQuestionsMutation, useSubmitResponsesMutation
} from "../../../../redux/rootslices/api/questions.slice";
import {showFailureToast, showSuccessToast} from "../../../../util/toasts";
import {useNavigate, useParams} from "react-router-dom";
import {authorizedPaths} from "../../../../router/paths";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import {AppBar, Toolbar} from "@mui/material";
import {styled, useTheme} from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import FormQuestionCard, {FormQuestionResponse} from "../../../../components/elements/FormQuestionCard";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import {updateSingleGroupData} from "../../../../redux/rootslices/data/groups.slice";
import {useDispatch} from "react-redux";
import Resizer from "react-image-file-resizer";

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

const validateData = (responses: FormQuestionResponse[]): string[] => {
    const errors: string[] = [];

    for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const questionIndex = i + 1; // Question index is 1-based

        if(!response) {
            errors.push(`Question ${questionIndex} cannot be empty.`);
            continue;
        }

        switch (response.type) {
            case QuestionType.TEXT:
                if (response.response.trim() === '') {
                    errors.push(`Question ${questionIndex} cannot be empty.`);
                }
                continue;

            case QuestionType.IMAGE:
                if (!(response.response instanceof File) || !response.response.type.startsWith('image/')) {
                    errors.push(`Question ${questionIndex} should have a valid image file.`);
                }
                continue;

            case QuestionType.DATE:
                if (response.response === null || response.response.trim() === '') {
                    errors.push(`Please choose a date for Question ${questionIndex}.`);
                }
                continue;

            case QuestionType.TIME:
                if (response.response === null || response.response.trim() === '') {
                    errors.push(`Please choose a time for Question ${questionIndex}.`);
                }
                continue;

            case QuestionType.DROPDOWN:
                if (response.response === null || response.response.trim() === '') {
                    errors.push(`Please choose an option for Question ${questionIndex}.`);
                }
                continue;

            case QuestionType.CHECKBOX:
                if (!Array.isArray(response.response) || response.response.length === 0) {
                    errors.push(`Please choose at least one option for Question ${questionIndex}.`);
                }
        }
    }

    return errors;
};

const compressImage = (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const maxSizeInBytes = 2 * 1024 * 1024;
        const initialQuality = 90;

        const resizeAndCompress = (image: File, quality: number) => {
            Resizer.imageFileResizer(
                image,
                800,
                600,
                'JPEG',
                quality, // quality
                0, // rotation
                (uri) => {
                    const compressedDataUrl = uri as string;
                    const compressedFileSize = compressedDataUrl.length * 0.75; // Base64 encoded string size in bytes

                    if (compressedFileSize < maxSizeInBytes || quality <= 0) {
                        resolve(compressedDataUrl);
                    } else {
                        const newQuality = Math.max(quality - 10, 5); // Decrease quality by 10
                        resizeAndCompress(image, newQuality);
                    }
                },
                'base64'
            );
        };

        resizeAndCompress(file, initialQuality);
    });
};



export default function QuestionForm(): React.ReactElement {
    const {groupId} = useParams();
    const theme = useTheme()
    const dispatch = useDispatch()

    const [getQuestions, {isLoading: loadingQuestions}] = useGetQuestionsMutation()
    const [submit, {isLoading: submitting}] = useSubmitResponsesMutation()

    const [questionResponse, setQuestionResponse] = useState<GroupQuestionsResponse>()
    const [formResponses, setFormResponses] = useState<FormQuestionResponse[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const navigate = useNavigate()

    if (groupId === undefined) {
        navigate(authorizedPaths.groups)
    }

    useEffect(() => {
        handleGetQuestions()
    }, []);

    useEffect(() => {
        const initialResponses: FormQuestionResponse[] = (questionResponse?.questions ?? []).map((question) => {
            return {
                type: question.questionType,
                response: '',
                id: question.id ?? '',
            } as FormQuestionResponse;
        });

        setFormResponses(initialResponses);
    }, [questionResponse?.questions]);


    const handleGetQuestions = () => {
        const request: GroupIdRequest = {
            groupId: groupId ?? ''
        }

        getQuestions(request)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    setQuestionResponse(response.data)
                } else {
                    showFailureToast(response.message ?? 'Failed to load questions, try again later')
                }
            })
            .catch((result) => {
                console.log(result)
                showFailureToast(result.message ?? "Failed to load questions")
            })
    }

    const handleAnswerChange = (response: FormQuestionResponse, index: number) => {
        setFormResponses((prevResponses) => {
            const updatedResponses = [...prevResponses];
            updatedResponses[index] = response;
            return updatedResponses;
        });
    };

    const convertFileToBase64 = (file: File | null): Promise<string | null> => {
        return new Promise((resolve) => {
            if (file instanceof File) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const compressedBase64 = await compressImage(file); // Compress the image
                    resolve(compressedBase64);
                };
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        });
    };


    const handleSubmit = async () => {
        let errors = validateData(formResponses)
        setErrors(errors)

        if (errors.length === 0) {

            const updatedResponses = await Promise.all(
                formResponses.map(async (response) => {
                    if (response && response.type === QuestionType.IMAGE && response.response instanceof File) {
                        const base64String = await convertFileToBase64(response.response);
                        return {...response, response: base64String};
                    }
                    return response;
                })
            );

            const request: FormDataResponse = {
                groupId: groupId ?? '',
                responses: updatedResponses
            }

            submit(request)
                .unwrap()
                .then((response) => {
                    if (response.success) {
                        showSuccessToast('Response saved successfully, newsletter will be generated as soon as responses are collected from everyone')
                        dispatch(updateSingleGroupData({updatedData: response.data}))
                        navigate(authorizedPaths.groups)
                    } else {
                        showFailureToast(response.message ?? 'Failed to save your response, please try later')
                    }
                })
                .catch((result) => {
                    showFailureToast(result.data.message ?? "Failed to save your response")
                })
        } else {
            showFailureToast('There are error(s), please handle them')
        }

        console.log("Form Responses:", formResponses);
    };

    return (
        <Box sx={{display: 'flex', height: "100%"}}>
            <CssBaseline/>
            <AppBar position="fixed" sx={{backgroundColor: theme.palette.primary.main}}>
                <Toolbar>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        onClick={()=> {navigate(authorizedPaths.groups)}}
                        sx={{flexGrow: 1, display: {xs: 'none', sm: 'block'}}}
                    >
                        Newsletter
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="main"
                sx={{
                    p: 2,
                    gap: 2,
                    width: "100%",
                }}
            >
                <DrawerHeader/>
                <Typography
                    component="h1"
                    variant="h2"
                    sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}
                >
                    {questionResponse?.group?.groupName ?? 'Questions'}
                </Typography>
                <Typography
                    component="h1"
                    variant="h6"
                    color="text.secondary"
                    sx={{
                        textAlign: 'center',
                        mb: 5
                    }}
                >
                    Fill out this form for this month's newsletter edition.
                </Typography>
                {errors && errors.length !== 0 && (
                    <Alert severity="error" sx={{mt: 2, mb: 2}}>
                        <Typography variant="body1">Validation Errors:</Typography>
                        <ul>
                            {errors.map((error, index) => (
                                <React.Fragment key={index}>
                                    {error && (
                                        <li>{error}</li>
                                    )}
                                </React.Fragment>
                            ))}
                        </ul>
                    </Alert>
                )}
                {
                    questionResponse?.group?.acceptQuestionResponse && !questionResponse?.questionsAlreadyTaken ?
                        <React.Fragment>
                            {
                                questionResponse?.questions?.map((question, index) => (
                                    <FormQuestionCard
                                        onAnswerChange={(response) => {
                                            handleAnswerChange(response, index)
                                        }}
                                        key={index}
                                        question={question}
                                        index={index}/>
                                ))
                            }
                            <Box sx={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                            }}>
                                <Box sx={{flex: 1}}/>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loadingQuestions || submitting}
                                    onClick={handleSubmit}
                                    sx={{
                                        mt: 2,
                                        mb: 3,
                                        pl: 5,
                                        pr: 5,
                                    }}
                                >
                                    Submit
                                </Button>
                            </Box>
                        </React.Fragment> :
                        <React.Fragment>
                            <Typography
                                component="h1"
                                variant="h6"
                                sx={{
                                    textAlign: 'center',
                                }}
                            >
                                {
                                    questionResponse?.questionsAlreadyTaken ?
                                        'You have already submitted this form, check back later.' :
                                        'Sorry, this form is closed now. Please check back later or reach out to your group owner/editor for a form.'
                                }

                            </Typography>
                            <Typography
                                component="h1"
                                variant="h6"
                                color="text.secondary"
                                sx={{
                                    textAlign: 'center',
                                    mb: 5
                                }}
                            >
                                Contact <a
                                href={`mailto:${questionResponse?.group?.groupOwner.emailAddress}`}>{questionResponse?.group?.groupOwner.emailAddress}</a> for
                                more information
                            </Typography>
                        </React.Fragment>
                }
            </Box>
        </Box>
    )
}