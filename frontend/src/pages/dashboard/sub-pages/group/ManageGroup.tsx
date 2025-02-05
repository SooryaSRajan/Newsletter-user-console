import Typography from "@mui/material/Typography";
import React, {useEffect, useRef, useState} from "react";
import {Card, Container} from "@mui/material";
import Box from "@mui/material/Box";
import {isEmpty} from "../../../../util/validation";
import {useLocation, useNavigate} from "react-router-dom";
import {
    GroupData,
    GroupEditRequest,
    GroupRequest,
    GroupMember,
    GroupUserEditAccessRequest,
    GroupUserRequest,
    useDeleteGroupMutation,
    useEditGroupMutation,
    useLeaveGroupMutation,
    useRemoveUserMutation,
    useUpdateEditAccessToUserMutation,
    useReleaseQuestionsMutation,
    useGenerateNewsletterMutation, useGetGroupMutation,
} from "../../../../redux/rootslices/api/groups.slice";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {showFailureToast, showInformationToast, showSuccessToast} from "../../../../util/toasts";
import {authorizedPaths, paths} from "../../../../router/paths";
import {Mail, NavigateNext, Refresh} from "@mui/icons-material";
import {
    selectGroupById,
    updateGroupDescription,
    updateGroupName,
    updateSingleGroupData
} from "../../../../redux/rootslices/data/groups.slice";
import {useDispatch, useSelector} from "react-redux";
import {memoizedSelectUserData} from "../../../../redux/rootslices/data/auth-data.slice";
import UserProfileCard from "../../../../components/elements/UserProfileCard";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import UserManagementTable from "../../../../components/elements/UserManagementTable";
import AlertDialog, {AlertDialogRef} from "../../../../components/elements/AlertDialog";
import InvitationDialog, {InvitationDialogRef} from "../../../../components/elements/InvitationDialog";
import {
    Invitation,
    useInviteUserToGroupMutation,
    useListAllInvitationsByGroupMutation, useRemoveInvitationFromGroupMutation
} from "../../../../redux/rootslices/api/invitations.slice";
import {
    InvitationsActionType,
    InvitationsProvider,
    useInvitations
} from "../../../../components/elements/InvitationsProvider";
import UserInvitationListCard from "../../../../components/elements/UserInvitationListCard";
import IconButton from "@mui/material/IconButton";

export default function ManageGroup(): React.ReactElement {
    const {state} = useLocation();
    const dispatch = useDispatch();
    const groupId = state as string;

    const navigator = useNavigate()

    const [getGroup] = useGetGroupMutation();

    const groupData: GroupData = useSelector(
        (state: any) => selectGroupById(state, groupId)
    ) ?? {} as GroupData;

    const handleReload = () => {
        const request: GroupRequest = {
            groupId: groupData.id,
        }

        getGroup(request)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    dispatch(updateSingleGroupData({updatedData: response.data}))
                    window.location.reload()
                    showSuccessToast(response.message ?? 'Group fetched successfully')

                } else {
                    showFailureToast(response.message ?? 'Failed to fetch group')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Could not fetch group")
            })
    }

    const userEmailAddress = useSelector(memoizedSelectUserData).emailAddress
    const [formTaken, setFormTaken] = useState<boolean>(false)

    useEffect(() => {
        const currentUserResponse = groupData.questionResponses?.filter(response => response.userEmailAddress.includes(userEmailAddress)) ?? []
        setFormTaken(currentUserResponse.length !== 0)
    }, [groupData]);

    if (isEmpty(groupId)) {
        return (
            <Typography variant="body1">
                Failed to load data
            </Typography>
        )
    }

    const isGroupOwner = groupData?.groupOwner?.emailAddress === userEmailAddress
    const groupUser: GroupMember | undefined = groupData?.groupMembers?.find(member => member.user.emailAddress === userEmailAddress)

    if (!groupUser) {
        return <Typography variant="body1">
            You are not part of this group
        </Typography>
    }

    return (
        <InvitationsProvider>
            <Container
                component="main"
                disableGutters
                sx={{
                    padding: 2,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    position: 'relative',
                    minWidth: "100%",
                    flex: 1
                }}
            >
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                    <div>
                        <Typography
                            component="h1"
                            variant="h2"
                            sx={{
                                fontWeight: 'bold',
                                alignSelf: "flex-start",
                                fontSize: {
                                    xs: '1rem',
                                    sm: '2rem',
                                    xl: '3rem',
                                },
                            }}
                        >
                            {isGroupOwner ? `Manage` : ''} {groupData.groupName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Group ID: {groupData.id}
                        </Typography>
                    </div>
                    <IconButton
                        color="primary"
                        onClick={handleReload}
                        sx={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <Refresh/>
                    </IconButton>
                </div>
                {
                    groupData.acceptQuestionResponse ?
                        <Button
                            type="button"
                            variant="contained"
                            color="info"
                            disabled={formTaken}
                            sx={{mt: 3, mb: 1}}
                            onClick={() => {
                                navigator(`/form/${groupData.id}`)
                            }}
                            endIcon={<NavigateNext/>}
                        >
                            Fill questions
                        </Button> : <React.Fragment/>
                }
                {isGroupOwner ? <RenderOwnerGroup groupData={groupData} groupUser={groupUser}/> :
                    <RenderMemberGroup groupData={groupData} canEdit={groupUser?.hasEditAccess ?? false}/>}
            </Container>
        </InvitationsProvider>
    )
}

function RenderMemberGroup(props: { groupData: GroupData, canEdit: boolean }): React.ReactElement {
    const groupData = props.groupData;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [leaveGroup, {isLoading}] = useLeaveGroupMutation()
    const [releaseQuestions] = useReleaseQuestionsMutation()

    const dialogRef = useRef<AlertDialogRef>(null);
    const releaseQuestionRef = useRef<AlertDialogRef>(null);

    const handleLeaveGroup = () => {
        const data: GroupRequest = {
            groupId: groupData.id
        }

        leaveGroup(data)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    showSuccessToast("Left group successfully")
                    navigate(authorizedPaths.groups)
                } else {
                    showFailureToast(response.message ?? 'Failed to leave group, try again later')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Failed to leave group")
            })
    }

    const handleReleaseQuestions = () => {
        const request: GroupRequest = {
            groupId: groupData.id,
        }

        releaseQuestions(request)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    dispatch(updateSingleGroupData({updatedData: response.data}))
                    showSuccessToast(response.message ?? 'Questions released successfully')

                } else {
                    showFailureToast(response.message ?? 'Failed to release questions')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Could not release questions")
            })
    }

    return (
        <Box
            maxWidth="xl"
        >
            <Card
                sx={{
                    mt: 3,
                    p: 3,
                    maxWidth: "100%",
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <AlertDialog
                    ref={dialogRef}
                    title="Leave group?"
                    message="Are you sure you want to leave this group, you won't be able to participate in future activities and receive newsletters."
                    acceptLabel='Leave'

                    onAccept={handleLeaveGroup}
                />
                <AlertDialog
                    ref={releaseQuestionRef}
                    title="Release questions?"
                    message="Are you sure you want to release questions for this month, this is an irrevrersible action. Questions can be requested again only after newsletter is generated?"
                    acceptLabel='Release'
                    onAccept={() => {
                        handleReleaseQuestions()
                    }}
                />
                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                }}>
                    Group Description
                </Typography>
                <Typography variant="body1">
                    {groupData.groupDescription}
                </Typography>

                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                    mt: 4,
                    mb: 1
                }}>
                    Group Owner
                </Typography>
                <UserProfileCard user={groupData.groupOwner}/>
            </Card>
            <Card
                sx={{
                    mt: 3,
                    p: 3,
                    maxWidth: "100%",
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                }}>
                    Group Members
                </Typography>
                <List>
                    {groupData?.groupMembers?.map(member =>
                        <ListItem key={member.user.emailAddress}>
                            <UserProfileCard user={member.user}/>
                        </ListItem>
                    )}
                </List>
            </Card>
            <Box sx={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
            }}>
                <Box sx={{flex: 1}}/>
                {
                    props.canEdit ?
                        <React.Fragment>
                            <Button
                                type="submit"
                                variant="outlined"
                                disabled={groupData.acceptQuestionResponse}
                                sx={{mt: 3, mb: 1}}
                                onClick={() => {
                                    releaseQuestionRef.current?.open()
                                }}
                            >
                                Publish Questions
                            </Button>
                            <Button
                                type="button"
                                variant="contained"
                                sx={{mt: 3, mb: 1}}
                                disabled={groupData.acceptQuestionResponse}
                                endIcon={<NavigateNext/>}
                                onClick={() => navigate(authorizedPaths.manageQuestions, {state: groupData.id})}
                            >
                                Manage Questions
                            </Button>
                        </React.Fragment>
                        : <React.Fragment/>
                }
                <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    sx={{mt: 3, mb: 1}}
                    onClick={() => dialogRef.current?.open()}
                >
                    Leave Group
                </Button>
            </Box>
        </Box>
    )
}

function RenderOwnerGroup(props: { groupData: GroupData, groupUser: GroupMember }): React.ReactElement {
    const groupData = props.groupData;
    const navigate = useNavigate()
    const dispatch = useDispatch();

    const {state, dispatch: invitationsDispatch} = useInvitations();

    const [editGroup, {isLoading: isEdit}] = useEditGroupMutation()
    const [deleteGroup, {isLoading: isDeleting}] = useDeleteGroupMutation()
    const [removeUser, {isLoading: isRemovingUser}] = useRemoveUserMutation()
    const [userEditAccess, {isLoading: isEditingGroup}] = useUpdateEditAccessToUserMutation()
    const [inviteUser, {isLoading: isInvitingUser}] = useInviteUserToGroupMutation()
    const [listInvitations] = useListAllInvitationsByGroupMutation()
    const [deleteInvitation] = useRemoveInvitationFromGroupMutation()
    const [releaseQuestions] = useReleaseQuestionsMutation()
    const [generateNewsletter] = useGenerateNewsletterMutation()

    const userEmailAddress = useSelector(memoizedSelectUserData).emailAddress

    const [groupNameError, setGroupNameError] = useState<string>('')
    const [groupDescError, setGroupDescError] = useState<string>('')
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>()

    console.log(groupMembers)

    const [groupName, setGroupName] = useState<string>(groupData.groupName)
    const [groupDesc, setGroupDesc] = useState<string>(groupData.groupDescription)
    const [generatingNewsLetter, setGeneratingNewsLetter] = useState<boolean>(false)
    const [releaseDateCheck, setReleaseDateCheck] = useState<[number, boolean]>([0, true])

    const deleteGroupDialogRef = useRef<AlertDialogRef>(null);
    const generateNewsletterDialogRef = useRef<AlertDialogRef>(null);
    const invitationDialogRef = useRef<InvitationDialogRef>(null);
    const deleteInvitationRef = useRef<AlertDialogRef>(null);
    const releaseQuestionRef = useRef<AlertDialogRef>(null);

    useEffect(() => {
        setGroupMembers(groupData.groupMembers.filter(member => member !== props.groupUser))
    }, [groupData]);

    const getReleaseDate = (releaseDateString: string | null): [number, boolean] => {
        if (!releaseDateString) {
            return [0, true]
        }

        const releaseDate = new Date(releaseDateString);

        const currentDate = new Date();
        const differenceMs = releaseDate.getTime() - currentDate.getTime();
        const daysLeft = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
        const canRelease = currentDate.getTime() >= releaseDate.getTime();

        return [daysLeft, canRelease];
    }

    useEffect(() => {
        setReleaseDateCheck(getReleaseDate(groupData.releaseDate))
    }, [groupData]);

    const pullInvitations = () => {

        const request: GroupRequest = {
            groupId: groupData.id,
        }

        listInvitations(request)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    const data: Invitation[] = response.data
                    invitationsDispatch({
                        type: InvitationsActionType.SET_INVITATIONS,
                        payload: data,
                    });
                } else {
                    showFailureToast(response.message ?? 'Failed to get invitations')
                }
            })
            .catch((result) => {
                showFailureToast(result.message ?? "Could not retrieve invitations")
            })
    }

    const handleReleaseQuestions = () => {
        const request: GroupRequest = {
            groupId: groupData.id,
        }

        releaseQuestions(request)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    dispatch(updateSingleGroupData({updatedData: response.data}))
                    showSuccessToast(response.message ?? 'Questions released successfully')

                } else {
                    showFailureToast(response.message ?? 'Failed to release questions')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Could not release questions")
            })
    }

    const handleGenerateNewsletter = () => {
        const request: GroupRequest = {
            groupId: groupData.id,
        }

        setGeneratingNewsLetter(true)
        showInformationToast('Generating newsletter...')

        generateNewsletter(request)
            .unwrap()
            .then((response) => {
                setGeneratingNewsLetter(false)
                if (response.success) {
                    dispatch(updateSingleGroupData({updatedData: response.data}))
                    showSuccessToast(response.message ?? 'Newsletter generated successfully')

                } else {
                    showFailureToast(response.message ?? 'Failed to generate newsletter')
                }
            })
            .catch((result) => {
                setGeneratingNewsLetter(false)
                showFailureToast(result.data.message ?? "Could not generate newsletter")
            })
    }

    const handleDeleteInvitation = (email: string) => {
        const request: GroupUserRequest = {
            groupId: groupData.id,
            userEmail: email
        }

        deleteInvitation(request)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    const data: Invitation = response.data
                    showSuccessToast(response.message ?? 'Invitation deleted successfully')
                    invitationsDispatch({
                        type: InvitationsActionType.REMOVE_INVITATION_BY_EMAIL,
                        payload: data.id.emailAddress,
                    });
                } else {
                    showFailureToast(response.message ?? 'Failed to delete invitation')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Could not delete invitation")
            })
    }

    useEffect(() => {
        pullInvitations()
    }, [listInvitations]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = data.get('group-name')?.toString() ?? '';
        const description = data.get('description')?.toString() ?? '';

        let valid: boolean = true

        if (isEmpty(name)) {
            setGroupNameError("Please enter a group name")
            valid = false
        } else {
            setGroupNameError('')
        }

        if (isEmpty(description)) {
            setGroupDescError("Please enter a description")
            valid = false
        } else {
            setGroupDescError('')
        }

        if (name === groupData.groupName && description === groupData.groupDescription) {
            showFailureToast("Cannot update same values, discarding request")
            valid = false
        }

        if (valid) {
            const data: GroupEditRequest = {
                groupId: groupData.id,
                groupName: name,
                groupDescription: description
            }

            editGroup(data)
                .unwrap()
                .then((response) => {
                    if (response.success) {
                        showSuccessToast("Group data updated successfully")
                        dispatch(updateGroupName({groupId: groupData.id, groupName: name}));
                        dispatch(updateGroupDescription({groupId: groupData.id, groupDescription: description}));

                    } else {
                        showFailureToast(response.message ?? 'Group update failed, try again later')
                    }
                })
                .catch((result) => {
                    showFailureToast(result.data.message ?? "Could not update group information")
                })
        }
    }

    const handleInvitation = (userEmail: string) => {
        const data: GroupUserRequest = {
            groupId: groupData.id,
            userEmail: userEmail
        }

        inviteUser(data)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    showSuccessToast(response.message ?? "Invited user successfully")
                    const data: Invitation = response.data
                    invitationsDispatch({
                        type: InvitationsActionType.ADD_INVITATION,
                        payload: data,
                    });
                } else {
                    showFailureToast(response.message ?? 'Failed to invite user, try again later')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Could not invite user")
            })
    }

    const handleDeletion = () => {
        const data: GroupRequest = {
            groupId: groupData.id
        }

        deleteGroup(data)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    showSuccessToast("Group deleted successfully")
                    navigate(authorizedPaths.groups)
                } else {
                    showFailureToast(response.message ?? 'Group deletion failed, try again later')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? "Could delete group")
            })
    }

    const handleUserDeletion = (email: string) => {
        const data: GroupUserRequest = {
            groupId: groupData.id,
            userEmail: email
        }

        removeUser(data)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    showSuccessToast(response.message ?? "Removed user successfully")
                    dispatch(updateSingleGroupData({updatedData: response.data}))
                } else {
                    showFailureToast(response.message ?? 'User removal failed, try again later')
                }
            })
            .catch((result) => {
                showFailureToast(result.message ?? "Could not remove user")
            })
    }

    const handleEditToggle = (email: string, canEdit: boolean) => {
        const data: GroupUserEditAccessRequest = {
            groupId: groupData.id,
            userEmail: email,
            canEdit: canEdit
        }

        userEditAccess(data)
            .unwrap()
            .then((response) => {
                if (response.success) {
                    showSuccessToast("User access changed successfully")
                    dispatch(updateSingleGroupData({updatedData: response.data}))
                } else {
                    showFailureToast(response.message ?? 'Cannot change user access, try again later')
                }
            })
            .catch((result) => {
                showFailureToast(result.data.message ?? 'Cannot change user access, try again later')
            })
    }

    return (
        <Box
            maxWidth="xl"
        >
            <Card
                sx={{
                    mt: 3,
                    p: 3,
                    maxWidth: "100%",
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                }}>
                    Update Group Information
                </Typography>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: 3,
                    }}
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        value={groupName}
                        id="group-name"
                        label="Group Name"
                        name="group-name"
                        type="text"
                        autoComplete="organization"
                        autoFocus
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setGroupName(e.target.value)
                        }}
                        error={!isEmpty(groupNameError)}
                        helperText={groupNameError}
                    />
                    <TextField
                        rows={4}
                        multiline
                        margin="normal"
                        required
                        fullWidth
                        value={groupDesc}
                        name="description"
                        label="Description"
                        type="text"
                        id="description"
                        autoComplete="text"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setGroupDesc(e.target.value)
                        }}
                        error={!isEmpty(groupDescError)}
                        helperText={groupDescError}
                    />
                    <Box sx={{
                        flex: 1
                    }}>
                    </Box>
                    <Box sx={{
                        display: "flex",
                        alignSelf: "end",
                        flexDirection: "row",
                        gap: 2,
                    }}>
                        <Button
                            type="button"
                            variant="outlined"
                            disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || generatingNewsLetter}
                            onClick={() => {
                                setGroupName(groupData.groupName)
                                setGroupDesc(groupData.groupDescription)
                            }}
                            sx={{mt: 3, mb: 1}}
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || generatingNewsLetter}
                            sx={{mt: 3, mb: 1}}
                        >
                            Update Group Information
                        </Button>
                    </Box>
                </Box>
            </Card>
            {groupMembers?.length !== 0 ?
                <Card
                    sx={{
                        mt: 3,
                        p: 3,
                        maxWidth: "100%",
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Typography component="h1" variant="h6" sx={{
                        fontWeight: 'bold',
                    }}>
                        Manage Users
                    </Typography>
                    <Typography variant="body2">
                        Add or remove existing users, revoke or grant editing permission and manage your group
                        invitations.
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        mt: 4
                    }}>
                        <UserManagementTable
                            onDeleteUser={(member) => {
                                handleUserDeletion(member.user.emailAddress)
                            }}
                            onEditToggle={(member, state) => {
                                handleEditToggle(member.user.emailAddress, state)
                            }}
                            members={groupMembers ?? []}
                        />
                    </Box>
                </Card>
                : <React.Fragment/>
            }
            <Card
                sx={{
                    mt: 3,
                    p: 3,
                    maxWidth: "100%",
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                }}>
                    Invitations
                </Typography>
                <Typography variant="body2">
                    Invite new users or revoke existing invitations. (Invitations cannot be revoked once accepted)
                </Typography>
                <AlertDialog
                    ref={deleteInvitationRef}
                    title="Delete invitation?"
                    message="Are you sure you want to delete this invitation?"
                    acceptLabel='Delete'
                    onAcceptWithData={(email) => {
                        handleDeleteInvitation(email)
                    }}
                />
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 2
                }}>
                    {state.invitations.map((invitation) => (
                        <UserInvitationListCard
                            key={invitation.id.emailAddress}
                            emailAddress={invitation.id.emailAddress}
                            onDelete={() => {
                                deleteInvitationRef.current?.openWithData(invitation.id.emailAddress)
                            }}
                        />
                    ))}
                </Box>
                <Box sx={{
                    display: "flex",
                    alignSelf: "end",
                    flexDirection: "row",
                    gap: 2,
                }}>
                    <InvitationDialog ref={invitationDialogRef} onAccept={(email) => {
                        handleInvitation(email)
                    }}/>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || generatingNewsLetter}
                        sx={{mt: 3, mb: 1}}
                        onClick={() => invitationDialogRef.current?.openDialog()}
                        endIcon={<NavigateNext/>}
                    >
                        Invite New User
                    </Button>
                </Box>
            </Card>
            <Card
                sx={{
                    mt: 3,
                    p: 3,
                    maxWidth: "100%",
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                }}>
                    Manage Questions
                </Typography>
                <Typography variant="body2">
                    Curate, edit or remove questions for users to fill out
                </Typography>
                <Box sx={{
                    display: "flex",
                    alignSelf: "end",
                    flexDirection: "row",
                    gap: 2,
                }}>
                    <AlertDialog
                        ref={releaseQuestionRef}
                        title="Release questions?"
                        message="Are you sure you want to release questions for this month, this is an irrevrersible action. Questions can be requested again only after newsletter is generated?"
                        acceptLabel='Release'
                        onAccept={() => {
                            handleReleaseQuestions()
                        }}
                    />
                    <Button
                        type="submit"
                        variant="outlined"
                        disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || groupData.acceptQuestionResponse || generatingNewsLetter}
                        sx={{mt: 3, mb: 1}}
                        onClick={() => {
                            releaseQuestionRef.current?.open()
                        }}
                    >
                        Publish Questions
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || groupData.acceptQuestionResponse || generatingNewsLetter}
                        sx={{mt: 3, mb: 1}}
                        endIcon={<NavigateNext/>}
                        onClick={() => navigate(authorizedPaths.manageQuestions, {state: groupData.id})}
                    >
                        Manage Questions
                    </Button>
                </Box>
            </Card>
            {
                groupData.acceptQuestionResponse && <Card
                    sx={{
                        mt: 3,
                        p: 3,
                        maxWidth: "100%",
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Typography component="h1" variant="h6" sx={{
                        fontWeight: 'bold',
                    }}>
                        Responses
                    </Typography>
                    <Typography variant="body2">
                        View users who have filled out responses
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        alignSelf: "end",
                        flexDirection: "row",
                        gap: 2,
                    }}>
                        <Typography variant="body2" color="textSecondary">
                            {`${groupData.questionResponses.length}/${groupData.groupMembers.length} Users have filled responses`}
                        </Typography>
                    </Box>
                    {
                        groupData.questionResponses.length !== 0
                        && <List>
                            <Typography variant="body1">
                                Users who have filled responses:
                            </Typography>
                            {
                                groupData.questionResponses.map((response) =>
                                    <Card sx={{
                                        backgroundColor: '#2a2a2a',
                                        mt: 1
                                    }}>
                                        <Box
                                            sx={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: 1
                                            }}
                                        >
                                            <Typography sx={{width: '100%'}}>
                                                {response.userEmailAddress}
                                            </Typography>
                                        </Box>
                                    </Card>
                                )
                            }
                        </List>
                    }
                    {
                        groupData.groupMembers.length - groupData.questionResponses.length !== 0
                        && <List>
                            <Typography variant="body1">
                                Users who haven't filled responses:
                            </Typography>
                            {
                                groupData.groupMembers
                                    .filter(data => groupData.questionResponses.map(data => data.userEmailAddress).indexOf(data.user.emailAddress) === -1)
                                    .map((response) =>
                                        <Card sx={{
                                            backgroundColor: '#2a2a2a',
                                            mt: 1
                                        }}>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: 1
                                                }}
                                            >
                                                <Typography sx={{width: '100%', flex: 1, pl: 2}}>
                                                    {response.user.emailAddress}
                                                </Typography>
                                                <Button
                                                    sx={{
                                                        visibility: response.user.emailAddress !== userEmailAddress ? 'visible' : 'hidden'
                                                    }}
                                                    startIcon={
                                                        <Mail/>
                                                    }
                                                    onClick={() => {
                                                        //TODO: Push email with link to user to fill form
                                                    }}
                                                >
                                                    Remind user
                                                </Button>

                                            </Box>
                                        </Card>
                                    )
                            }
                        </List>
                    }
                </Card>
            }
            {
                groupData.acceptQuestionResponse && <Card
                    sx={{
                        mt: 3,
                        p: 3,
                        maxWidth: "100%",
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <AlertDialog
                        ref={generateNewsletterDialogRef}
                        title="Generate newsletter?"
                        message="Are you sure you want to generate newsletter for this month, this is an irreversible action and you cannot generate any more newsletters for this month."
                        acceptLabel='Generate Newsletter'
                        onAccept={handleGenerateNewsletter}
                    />
                    <Typography component="h1" variant="h6" sx={{
                        fontWeight: 'bold',
                    }}>
                        Generate Newsletter
                    </Typography>
                    <Typography variant="body2">
                        If you're ready to publish your newsletter, proceed by clicking on the publish button. This is a one
                        time process, questions cannot be processed and new newsletters cannot be issued once generated.
                        Proceed with caution.
                    </Typography>
                    {
                        !releaseDateCheck[1] && <Typography variant="subtitle2" sx={{mt: 2}}>
                            Next release can happen only after {releaseDateCheck[0]} days
                        </Typography>
                    }
                    <Box sx={{
                        display: "flex",
                        alignSelf: "end",
                        flexDirection: "row",
                        gap: 2,
                    }}>
                        <Button
                            type="submit"
                            variant="outlined"
                            disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || generatingNewsLetter || !releaseDateCheck[1]}
                            sx={{mt: 3, mb: 1}}
                            onClick={() => {
                                generateNewsletterDialogRef.current?.open()
                            }}
                        >
                            Publish Newsletter
                        </Button>
                    </Box>
                </Card>
            }
            <Card
                sx={{
                    mt: 3,
                    p: 3,
                    maxWidth: "100%",
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <AlertDialog
                    ref={deleteGroupDialogRef}
                    title="Delete group?"
                    message="Are you sure you want to delete this group, you won't be able to reverse this action and all data will be lost."
                    acceptLabel='Delete Group'
                    onAccept={handleDeletion}
                />
                <Typography component="h1" variant="h6" sx={{
                    fontWeight: 'bold',
                }}>
                    Delete Group
                </Typography>
                <Typography variant="body2">
                    Deleting the group will remove all information including group specific questions, users
                    associated with the groups and all responses. Proceed with caution.
                </Typography>
                <Box sx={{
                    display: "flex",
                    alignSelf: "end",
                    flexDirection: "row",
                    gap: 2,
                }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isDeleting || isEdit || isEditingGroup || isRemovingUser || isInvitingUser || generatingNewsLetter}
                        sx={{mt: 3, mb: 1}}
                        onClick={() => {
                            deleteGroupDialogRef.current?.open()
                        }}
                    >
                        Delete Group
                    </Button>
                </Box>
            </Card>
        </Box>
    )
}
