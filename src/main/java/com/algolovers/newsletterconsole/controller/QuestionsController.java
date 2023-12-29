package com.algolovers.newsletterconsole.controller;

import com.algolovers.newsletterconsole.data.entity.questions.Question;
import com.algolovers.newsletterconsole.data.model.api.Result;
import com.algolovers.newsletterconsole.data.model.api.request.group.GroupRequest;
import com.algolovers.newsletterconsole.data.model.api.request.question.GroupQuestionsRequest;
import com.algolovers.newsletterconsole.service.QuestionsService;
import com.algolovers.newsletterconsole.utils.ControllerUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionsController {

    private final QuestionsService questionsService;

    @PostMapping("/createOrUpdateQuestions")
    public ResponseEntity<Result<List<Question>>> createOrUpdateQuestions(@Valid @RequestBody GroupQuestionsRequest groupQuestionsRequest) {
        Result<List<Question>> questions = questionsService.createOrUpdateQuestions(groupQuestionsRequest);
        return ControllerUtils.processResultForResponseWithData(questions);
    }

    @PostMapping("/getQuestions")
    public ResponseEntity<Result<List<Question>>> getQuestions(@Valid @RequestBody GroupRequest groupRequest) {
        Result<List<Question>> questions = questionsService.getQuestions(groupRequest);
        return ControllerUtils.processResultForResponseWithData(questions);
    }

}
